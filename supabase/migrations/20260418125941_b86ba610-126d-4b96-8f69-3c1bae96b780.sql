ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS service_base_suburb text,
  ADD COLUMN IF NOT EXISTS service_base_postcode text,
  ADD COLUMN IF NOT EXISTS service_base_state text,
  ADD COLUMN IF NOT EXISTS service_base_lat numeric,
  ADD COLUMN IF NOT EXISTS service_base_lng numeric,
  ADD COLUMN IF NOT EXISTS service_radius_km integer NOT NULL DEFAULT 50;