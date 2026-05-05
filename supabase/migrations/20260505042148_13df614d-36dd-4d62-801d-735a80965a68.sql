ALTER TABLE public.saleshandy_sync_log
  ADD COLUMN IF NOT EXISTS response_code integer;