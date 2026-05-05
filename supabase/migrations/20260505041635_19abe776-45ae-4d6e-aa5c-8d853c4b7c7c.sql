ALTER TABLE public.saleshandy_sync_log
  ADD COLUMN IF NOT EXISTS endpoint_used text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_saleshandy_sync_log_email
  ON public.saleshandy_sync_log (lower(email));
CREATE INDEX IF NOT EXISTS idx_saleshandy_sync_log_attempted_at
  ON public.saleshandy_sync_log (attempted_at DESC);