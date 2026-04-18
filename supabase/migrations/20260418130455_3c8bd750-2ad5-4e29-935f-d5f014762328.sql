DROP VIEW IF EXISTS public.providers_public;

ALTER TABLE public.providers DROP COLUMN IF EXISTS postcode_ranges;

CREATE VIEW public.providers_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, description, logo, states, system_types, brands,
  price_range, rating, review_count, years_in_business, certifications,
  highlights, available_for_quote, response_time, warranty, website, phone,
  service_base_suburb, service_base_postcode, service_base_state,
  service_base_lat, service_base_lng, service_radius_km,
  approval_status, created_at, updated_at
FROM public.providers
WHERE approval_status = 'approved' AND available_for_quote = true;

GRANT SELECT ON public.providers_public TO anon, authenticated;