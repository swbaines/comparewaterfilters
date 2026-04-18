CREATE OR REPLACE FUNCTION public.validate_quote_request_recommended_systems()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  valid_ids TEXT[] := ARRAY[
    'under-sink-carbon',
    'reverse-osmosis',
    'whole-house-filtration',
    'uv',
    'water-softener',
    'hybrid'
  ];
  invalid_ids TEXT[];
BEGIN
  IF NEW.recommended_systems IS NULL OR array_length(NEW.recommended_systems, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(t)
  INTO invalid_ids
  FROM unnest(NEW.recommended_systems) AS t
  WHERE t <> ALL(valid_ids);

  IF invalid_ids IS NOT NULL AND array_length(invalid_ids, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid recommended_systems value(s): %. Valid IDs: %',
      array_to_string(invalid_ids, ', '),
      array_to_string(valid_ids, ', ');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_quote_request_recommended_systems_trigger ON public.quote_requests;
CREATE TRIGGER validate_quote_request_recommended_systems_trigger
BEFORE INSERT OR UPDATE OF recommended_systems ON public.quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_quote_request_recommended_systems();