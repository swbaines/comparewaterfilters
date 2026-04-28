-- 1. Audit log table
CREATE TABLE IF NOT EXISTS public.lead_temperature_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL,
  installation_timeline text,
  lead_temperature text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_temp_audit_quote
  ON public.lead_temperature_audit_log (quote_request_id);
CREATE INDEX IF NOT EXISTS idx_lead_temp_audit_created
  ON public.lead_temperature_audit_log (created_at DESC);

-- 2. RLS: admins read-only; inserts happen via SECURITY DEFINER trigger
ALTER TABLE public.lead_temperature_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read lead temperature audit log"
  ON public.lead_temperature_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Trigger function (runs AFTER INSERT, after set_lead_temperature has populated NEW.lead_temperature)
CREATE OR REPLACE FUNCTION public.log_quote_request_lead_temperature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lead_temperature_audit_log (
    quote_request_id,
    installation_timeline,
    lead_temperature
  ) VALUES (
    NEW.id,
    NEW.installation_timeline,
    NEW.lead_temperature
  );
  RETURN NEW;
END;
$$;

-- 4. Trigger
DROP TRIGGER IF EXISTS trg_log_quote_request_lead_temperature ON public.quote_requests;
CREATE TRIGGER trg_log_quote_request_lead_temperature
  AFTER INSERT ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_quote_request_lead_temperature();