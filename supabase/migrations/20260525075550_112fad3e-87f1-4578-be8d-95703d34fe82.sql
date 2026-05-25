ALTER TABLE public.quiz_submissions ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.quiz_submissions ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS recommended_systems text[] DEFAULT '{}'::text[];
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS recommendation_price_min integer;
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS recommendation_price_max integer;
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS recommendation_reason text;