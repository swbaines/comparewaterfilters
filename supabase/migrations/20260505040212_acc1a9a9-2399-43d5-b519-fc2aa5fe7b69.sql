
ALTER TABLE public.saleshandy_sync_log
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS request_body JSONB,
  ADD COLUMN IF NOT EXISTS tags_applied TEXT[],
  ADD COLUMN IF NOT EXISTS quiz_submission_id UUID;

ALTER TABLE public.saleshandy_sync_log
  ALTER COLUMN quote_request_id DROP NOT NULL;

-- Trigger function for quiz_submissions (recommendation stage)
CREATE OR REPLACE FUNCTION public.trigger_saleshandy_sync_quiz()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.consent IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://xbryypgsryjhuscyglbu.supabase.co/functions/v1/sync-to-saleshandy',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'quiz_submission_id', NEW.id,
      'source', 'recommendation'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quiz_submissions_saleshandy_sync ON public.quiz_submissions;
CREATE TRIGGER quiz_submissions_saleshandy_sync
AFTER INSERT ON public.quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_saleshandy_sync_quiz();
