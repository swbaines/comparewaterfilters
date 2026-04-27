-- 1. Reference table of allowed concern IDs (single source of truth)
CREATE TABLE IF NOT EXISTS public.valid_concern_ids (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.valid_concern_ids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Valid concern IDs are publicly readable" ON public.valid_concern_ids;
CREATE POLICY "Valid concern IDs are publicly readable"
  ON public.valid_concern_ids FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage valid concern IDs" ON public.valid_concern_ids;
CREATE POLICY "Admins can manage valid concern IDs"
  ON public.valid_concern_ids FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Seed the allowlist
INSERT INTO public.valid_concern_ids (id) VALUES
  ('whole-home'),
  ('taste'),
  ('chlorine'),
  ('skin-hair'),
  ('skin-shower'),
  ('drinking-quality'),
  ('fluoride'),
  ('heavy-metals'),
  ('pfas'),
  ('microplastics'),
  ('appliance'),
  ('bacteria'),
  ('not-sure'),
  ('hard-water'),
  ('replacement')
ON CONFLICT (id) DO NOTHING;

-- 3. Validation function used by both tables
CREATE OR REPLACE FUNCTION public.validate_concerns_array()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  invalid_ids TEXT[];
BEGIN
  IF NEW.concerns IS NULL OR array_length(NEW.concerns, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(c)
  INTO invalid_ids
  FROM unnest(NEW.concerns) AS c
  WHERE NOT EXISTS (SELECT 1 FROM public.valid_concern_ids v WHERE v.id = c);

  IF invalid_ids IS NOT NULL AND array_length(invalid_ids, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid concerns value(s): %. See public.valid_concern_ids for valid IDs.',
      array_to_string(invalid_ids, ', ');
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach triggers (drop-and-recreate so this migration is idempotent)
DROP TRIGGER IF EXISTS validate_concerns_on_quote_requests ON public.quote_requests;
CREATE TRIGGER validate_concerns_on_quote_requests
  BEFORE INSERT OR UPDATE OF concerns ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_concerns_array();

DROP TRIGGER IF EXISTS validate_concerns_on_quiz_submissions ON public.quiz_submissions;
CREATE TRIGGER validate_concerns_on_quiz_submissions
  BEFORE INSERT OR UPDATE OF concerns ON public.quiz_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_concerns_array();