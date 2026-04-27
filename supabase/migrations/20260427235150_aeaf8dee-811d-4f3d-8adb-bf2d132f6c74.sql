-- 1. Add columns to quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS installation_timeline text,
  ADD COLUMN IF NOT EXISTS lead_temperature text;

-- 2. Add columns to quiz_submissions
ALTER TABLE public.quiz_submissions
  ADD COLUMN IF NOT EXISTS installation_timeline text,
  ADD COLUMN IF NOT EXISTS lead_temperature text;

-- 3. Trigger function: derive lead_temperature from installation_timeline
CREATE OR REPLACE FUNCTION public.set_lead_temperature()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.installation_timeline IS NULL THEN
    NEW.lead_temperature := NULL;
  ELSIF NEW.installation_timeline ILIKE 'As soon as possible%'
     OR NEW.installation_timeline ILIKE 'Within 1 month%' THEN
    NEW.lead_temperature := 'hot';
  ELSIF NEW.installation_timeline ILIKE 'Within 3 months%' THEN
    NEW.lead_temperature := 'warm';
  ELSIF NEW.installation_timeline ILIKE 'Just researching%' THEN
    NEW.lead_temperature := 'cold';
  ELSE
    NEW.lead_temperature := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach triggers
DROP TRIGGER IF EXISTS set_lead_temperature_quote_requests ON public.quote_requests;
CREATE TRIGGER set_lead_temperature_quote_requests
  BEFORE INSERT OR UPDATE OF installation_timeline ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_temperature();

DROP TRIGGER IF EXISTS set_lead_temperature_quiz_submissions ON public.quiz_submissions;
CREATE TRIGGER set_lead_temperature_quiz_submissions
  BEFORE INSERT OR UPDATE OF installation_timeline ON public.quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_temperature();