
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS abn text DEFAULT '',
  ADD COLUMN IF NOT EXISTS plumber_licence_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS has_public_liability boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurer_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_business_url text DEFAULT '';
