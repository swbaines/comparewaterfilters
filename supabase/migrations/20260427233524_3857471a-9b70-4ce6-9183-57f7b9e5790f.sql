ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS maintenance_tolerance text;
ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS maintenance_tolerance text;