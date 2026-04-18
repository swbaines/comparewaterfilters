
CREATE OR REPLACE FUNCTION public.prevent_system_type_id_delete_if_referenced()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  provider_refs TEXT[];
  quote_count INT;
BEGIN
  SELECT array_agg(name)
  INTO provider_refs
  FROM public.providers
  WHERE OLD.id = ANY(system_types);

  SELECT count(*)
  INTO quote_count
  FROM public.quote_requests
  WHERE OLD.id = ANY(recommended_systems);

  IF (provider_refs IS NOT NULL AND array_length(provider_refs, 1) > 0)
     OR quote_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete system_type_id "%": still referenced by % provider(s) [%] and % quote request(s).',
      OLD.id,
      COALESCE(array_length(provider_refs, 1), 0),
      array_to_string(COALESCE(provider_refs, ARRAY[]::TEXT[]), ', '),
      quote_count;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_system_type_id_delete_if_referenced ON public.system_type_ids;

CREATE TRIGGER prevent_system_type_id_delete_if_referenced
BEFORE DELETE ON public.system_type_ids
FOR EACH ROW
EXECUTE FUNCTION public.prevent_system_type_id_delete_if_referenced();
