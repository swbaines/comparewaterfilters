CREATE OR REPLACE FUNCTION public.get_matched_vendors(
  _customer_lat numeric,
  _customer_lng numeric,
  _customer_state text,
  _recommended_systems text[],
  _limit int DEFAULT 10
)
RETURNS TABLE (
  provider_id uuid,
  name text,
  slug text,
  description text,
  logo text,
  rating numeric,
  review_count int,
  years_in_business int,
  response_time text,
  warranty text,
  phone text,
  website text,
  highlights text[],
  certifications text[],
  brands text[],
  system_types text[],
  matching_systems text[],
  service_base_suburb text,
  service_base_state text,
  service_radius_km int,
  distance_km numeric,
  avg_response_minutes numeric,
  win_rate numeric,
  state_share_pct numeric,
  cap_exceeded boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH month_state_totals AS (
    SELECT qr.customer_state AS cs, count(*)::numeric AS total
    FROM quote_requests qr
    WHERE qr.customer_state = _customer_state
      AND qr.created_at >= date_trunc('month', now())
      AND qr.is_test = false
    GROUP BY qr.customer_state
  ),
  vendor_state_counts AS (
    SELECT qr.provider_id AS pid, count(*)::numeric AS cnt
    FROM quote_requests qr
    WHERE qr.customer_state = _customer_state
      AND qr.created_at >= date_trunc('month', now())
      AND qr.is_test = false
      AND qr.provider_id IS NOT NULL
    GROUP BY qr.provider_id
  ),
  vendor_perf AS (
    SELECT
      qr.provider_id AS pid,
      avg(extract(epoch FROM (qr.first_response_at - qr.created_at)) / 60.0)::numeric AS avg_resp_min,
      ((count(*) FILTER (WHERE qr.lead_status = 'won'))::numeric
        / NULLIF(count(*) FILTER (WHERE qr.lead_status IN ('won','lost')), 0))::numeric AS wr
    FROM quote_requests qr
    WHERE qr.is_test = false
      AND qr.provider_id IS NOT NULL
    GROUP BY qr.provider_id
  ),
  candidates AS (
    SELECT
      p.id AS pid,
      p.name,
      p.slug,
      p.description,
      p.logo,
      p.rating,
      p.review_count,
      p.years_in_business,
      p.response_time,
      p.warranty,
      p.phone,
      p.website,
      p.highlights,
      p.certifications,
      p.brands,
      p.system_types,
      ARRAY(
        SELECT unnest(p.system_types)
        INTERSECT
        SELECT unnest(_recommended_systems)
      ) AS matching_systems,
      p.service_base_suburb,
      p.service_base_state,
      p.service_radius_km,
      CASE
        WHEN p.service_base_lat IS NOT NULL AND p.service_base_lng IS NOT NULL
             AND _customer_lat IS NOT NULL AND _customer_lng IS NOT NULL
        THEN (2 * 6371 * asin(sqrt(
          power(sin(radians(p.service_base_lat - _customer_lat) / 2), 2) +
          cos(radians(_customer_lat)) * cos(radians(p.service_base_lat)) *
          power(sin(radians(p.service_base_lng - _customer_lng) / 2), 2)
        )))::numeric
        ELSE NULL
      END AS distance_km
    FROM providers p
    JOIN provider_stripe_details psd ON psd.provider_id = p.id
    WHERE p.approval_status = 'approved'
      AND p.available_for_quote = true
      AND psd.stripe_payment_method_id IS NOT NULL
      AND psd.direct_debit_authorised_at IS NOT NULL
      AND p.system_types && _recommended_systems
  )
  SELECT
    c.pid,
    c.name,
    c.slug,
    c.description,
    c.logo,
    c.rating,
    c.review_count,
    c.years_in_business,
    c.response_time,
    c.warranty,
    c.phone,
    c.website,
    c.highlights,
    c.certifications,
    c.brands,
    c.system_types,
    c.matching_systems,
    c.service_base_suburb,
    c.service_base_state,
    c.service_radius_km,
    c.distance_km,
    vp.avg_resp_min,
    vp.wr,
    CASE
      WHEN mst.total IS NULL OR mst.total = 0 THEN 0::numeric
      ELSE round((COALESCE(vsc.cnt, 0) / mst.total) * 100, 1)
    END,
    (COALESCE(vsc.cnt, 0) / NULLIF(mst.total, 0)) > 0.4
  FROM candidates c
  LEFT JOIN vendor_perf vp ON vp.pid = c.pid
  LEFT JOIN vendor_state_counts vsc ON vsc.pid = c.pid
  LEFT JOIN LATERAL (SELECT mt.total FROM month_state_totals mt LIMIT 1) mst ON true
  WHERE c.distance_km IS NULL OR c.distance_km <= c.service_radius_km
  ORDER BY
    ((COALESCE(vsc.cnt, 0) / NULLIF(mst.total, 0)) > 0.4) ASC NULLS FIRST,
    COALESCE(vp.avg_resp_min, 999999) ASC,
    COALESCE(vp.wr, 0) DESC,
    c.rating DESC,
    c.years_in_business DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_matched_vendors(numeric, numeric, text, text[], int) TO anon, authenticated;