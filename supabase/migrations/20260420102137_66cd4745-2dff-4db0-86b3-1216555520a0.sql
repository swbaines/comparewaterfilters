ALTER TABLE public.provider_stripe_details
  ADD COLUMN IF NOT EXISTS direct_debit_authorised_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS direct_debit_authorised_ip TEXT,
  ADD COLUMN IF NOT EXISTS direct_debit_authorised_user_agent TEXT;