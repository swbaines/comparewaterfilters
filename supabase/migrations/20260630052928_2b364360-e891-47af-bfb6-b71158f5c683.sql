-- Normalise system_type_ids lookup: drop the non-canonical alias
-- 'whole-home-filtration' (canonical form is 'whole-house-filtration').
-- Defensive: if any provider/quote row still references the alias, rewrite it
-- to the canonical ID before removing the lookup row.
UPDATE public.providers
SET system_types = array_replace(system_types, 'whole-home-filtration', 'whole-house-filtration')
WHERE 'whole-home-filtration' = ANY(system_types);

UPDATE public.quote_requests
SET recommended_systems = array_replace(recommended_systems, 'whole-home-filtration', 'whole-house-filtration')
WHERE recommended_systems IS NOT NULL
  AND 'whole-home-filtration' = ANY(recommended_systems);

DELETE FROM public.system_type_ids WHERE id = 'whole-home-filtration';