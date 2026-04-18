-- Validate that providers.system_types only contains known IDs
CREATE OR REPLACE FUNCTION public.validate_provider_system_types()
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
  IF NEW.system_types IS NULL OR array_length(NEW.system_types, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(t)
  INTO invalid_ids
  FROM unnest(NEW.system_types) AS t
  WHERE t <> ALL(valid_ids);

  IF invalid_ids IS NOT NULL AND array_length(invalid_ids, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid system_types value(s): %. Valid IDs: %',
      array_to_string(invalid_ids, ', '),
      array_to_string(valid_ids, ', ');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_provider_system_types_trigger ON public.providers;
CREATE TRIGGER validate_provider_system_types_trigger
BEFORE INSERT OR UPDATE OF system_types ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.validate_provider_system_types();