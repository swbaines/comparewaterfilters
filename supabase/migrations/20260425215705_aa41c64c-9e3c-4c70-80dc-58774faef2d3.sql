ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS abn_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abn_verified_at timestamp with time zone;