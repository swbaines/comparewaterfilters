ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS abn_verification_response jsonb,
  ADD COLUMN IF NOT EXISTS abn_review_flag text;

CREATE INDEX IF NOT EXISTS idx_providers_abn_review_flag
  ON public.providers (abn_review_flag)
  WHERE abn_review_flag IS NOT NULL;