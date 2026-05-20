DROP TRIGGER IF EXISTS quote_request_saleshandy_sync ON public.quote_requests;
DROP TRIGGER IF EXISTS quiz_submissions_saleshandy_sync ON public.quiz_submissions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE command ILIKE '%sync-to-saleshandy%'
       OR command ILIKE '%process-saleshandy-retries%'
       OR jobname ILIKE '%saleshandy%';
  END IF;
END $$;