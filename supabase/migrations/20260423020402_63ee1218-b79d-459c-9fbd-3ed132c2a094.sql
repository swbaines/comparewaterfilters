ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS system_pricing jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.providers.system_pricing IS 'Per-system-type indicative price ranges. Shape: { "<system_type_id>": { "min": number, "max": number } }';