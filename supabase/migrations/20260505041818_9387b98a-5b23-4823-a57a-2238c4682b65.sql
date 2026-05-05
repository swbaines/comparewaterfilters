CREATE OR REPLACE FUNCTION public.trigger_saleshandy_sync()
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
    url := 'https://xbryypgsryjhuscyglbu.supabase.co/functions/v1/sync-to-saleshandy',
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