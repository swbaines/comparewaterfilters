ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS property_age TEXT;
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS property_age TEXT;