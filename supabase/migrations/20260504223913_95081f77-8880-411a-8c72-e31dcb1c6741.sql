
-- Sync log table
CREATE TABLE public.saleshandy_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','success','failed','skipped_no_consent')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  response_body JSONB,
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saleshandy_sync_log_quote ON public.saleshandy_sync_log(quote_request_id, attempted_at DESC);

ALTER TABLE public.saleshandy_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read saleshandy sync log"
  ON public.saleshandy_sync_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage saleshandy sync log"
  ON public.saleshandy_sync_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages saleshandy sync log"
  ON public.saleshandy_sync_log FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to auto-call edge function on new quote request
CREATE OR REPLACE FUNCTION public.trigger_saleshandy_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url TEXT;
  service_key TEXT;
BEGIN
  IF NEW.is_test = true THEN
    RETURN NEW;
  END IF;

  fn_url := 'https://xbryypgsryjhuscyglbu.supabase.co/functions/v1/sync-to-saleshandy';
  service_key := current_setting('app.settings.service_role_key', true);

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('quote_request_id', NEW.id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block insert on sync failure
  RETURN NEW;
END;
$$;

CREATE TRIGGER quote_request_saleshandy_sync
AFTER INSERT ON public.quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_saleshandy_sync();
