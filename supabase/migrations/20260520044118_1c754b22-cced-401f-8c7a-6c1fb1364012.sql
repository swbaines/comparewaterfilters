
-- Real-time HubSpot sync for customer leads only (vendors/providers excluded)

CREATE OR REPLACE FUNCTION public.trigger_hubspot_sync_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_test = true THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://xbryypgsryjhuscyglbu.supabase.co/functions/v1/sync-to-hubspot',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'quote_request_id', NEW.id,
      'source', 'quote_request'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_hubspot_sync_quiz()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.consent IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://xbryypgsryjhuscyglbu.supabase.co/functions/v1/sync-to-hubspot',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'quiz_submission_id', NEW.id,
      'source', 'quiz_submission'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS hubspot_sync_on_quote_insert ON public.quote_requests;
CREATE TRIGGER hubspot_sync_on_quote_insert
AFTER INSERT ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_hubspot_sync_quote();

DROP TRIGGER IF EXISTS hubspot_sync_on_quiz_insert ON public.quiz_submissions;
CREATE TRIGGER hubspot_sync_on_quiz_insert
AFTER INSERT ON public.quiz_submissions
FOR EACH ROW EXECUTE FUNCTION public.trigger_hubspot_sync_quiz();
