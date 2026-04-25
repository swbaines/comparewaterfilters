-- Enum for installation model
DO $$ BEGIN
  CREATE TYPE public.installation_model AS ENUM ('in_house_licensed', 'sub_contracted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS installation_model public.installation_model,
  ADD COLUMN IF NOT EXISTS plumbing_licence_state text,
  ADD COLUMN IF NOT EXISTS public_liability_insurance_amount numeric,
  ADD COLUMN IF NOT EXISTS installation_partners jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sub_contractor_confirmation_at timestamptz;