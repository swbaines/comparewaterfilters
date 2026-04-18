-- 1. Create lookup table
CREATE TABLE IF NOT EXISTS public.system_type_ids (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_type_ids ENABLE ROW LEVEL SECURITY;

-- 2. RLS: public read, admin-only write
DROP POLICY IF EXISTS "System type IDs are publicly readable" ON public.system_type_ids;
CREATE POLICY "System type IDs are publicly readable"
  ON public.system_type_ids FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage system type IDs" ON public.system_type_ids;
CREATE POLICY "Admins can manage system type IDs"
  ON public.system_type_ids FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Seed canonical IDs
INSERT INTO public.system_type_ids (id) VALUES
  ('under-sink-carbon'),
  ('reverse-osmosis'),
  ('whole-house-filtration'),
  ('uv'),
  ('water-softener'),
  ('hybrid')
ON CONFLICT (id) DO NOTHING;

-- 4. Refactor providers trigger to read from lookup
CREATE OR REPLACE FUNCTION public.validate_provider_system_types()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  invalid_ids TEXT[];
BEGIN
  IF NEW.system_types IS NULL OR array_length(NEW.system_types, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(t)
  INTO invalid_ids
  FROM unnest(NEW.system_types) AS t
  WHERE NOT EXISTS (SELECT 1 FROM public.system_type_ids s WHERE s.id = t);

  IF invalid_ids IS NOT NULL AND array_length(invalid_ids, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid system_types value(s): %. See public.system_type_ids for valid IDs.',
      array_to_string(invalid_ids, ', ');
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Refactor quote_requests trigger to read from lookup
CREATE OR REPLACE FUNCTION public.validate_quote_request_recommended_systems()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  invalid_ids TEXT[];
BEGIN
  IF NEW.recommended_systems IS NULL OR array_length(NEW.recommended_systems, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(t)
  INTO invalid_ids
  FROM unnest(NEW.recommended_systems) AS t
  WHERE NOT EXISTS (SELECT 1 FROM public.system_type_ids s WHERE s.id = t);

  IF invalid_ids IS NOT NULL AND array_length(invalid_ids, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid recommended_systems value(s): %. See public.system_type_ids for valid IDs.',
      array_to_string(invalid_ids, ', ');
  END IF;

  RETURN NEW;
END;
$$;