DROP VIEW IF EXISTS public.providers_public;

CREATE VIEW public.providers_public
WITH (security_invoker = on)
AS SELECT
  id, name, slug, description, logo, states, postcode_ranges,
  system_types, price_range, brands, rating, review_count,
  years_in_business, certifications, highlights, available_for_quote,
  response_time, warranty, website, phone, approval_status,
  service_base_suburb, service_base_postcode, service_base_state,
  service_base_lat, service_base_lng, service_radius_km,
  created_at, updated_at
FROM public.providers;

GRANT SELECT ON public.providers_public TO anon, authenticated;