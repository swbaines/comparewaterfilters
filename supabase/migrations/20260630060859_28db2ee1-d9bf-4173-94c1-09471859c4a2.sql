ALTER TABLE public.quiz_submissions ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS quiz_submissions_is_test_idx ON public.quiz_submissions(is_test);