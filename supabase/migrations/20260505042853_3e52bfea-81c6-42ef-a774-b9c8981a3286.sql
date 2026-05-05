-- Retry queue support for saleshandy_sync_log
ALTER TABLE public.saleshandy_sync_log
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_saleshandy_sync_log_retry_due
  ON public.saleshandy_sync_log (status, next_retry_at)
  WHERE status = 'retry_scheduled';

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;