-- Add contact_preference to quote_requests
ALTER TABLE public.quote_requests
ADD COLUMN contact_preference text;

-- Backfill existing rows with a safe default
UPDATE public.quote_requests
SET contact_preference = 'no_preference'
WHERE contact_preference IS NULL;

-- Enforce required + allowed values going forward
ALTER TABLE public.quote_requests
ALTER COLUMN contact_preference SET NOT NULL;

ALTER TABLE public.quote_requests
ADD CONSTRAINT quote_requests_contact_preference_check
CHECK (contact_preference IN ('phone', 'sms', 'email', 'no_preference'));

-- Mirror on quiz_submissions so the persisted lead snapshot includes it too
ALTER TABLE public.quiz_submissions
ADD COLUMN contact_preference text;

ALTER TABLE public.quiz_submissions
ADD CONSTRAINT quiz_submissions_contact_preference_check
CHECK (contact_preference IS NULL OR contact_preference IN ('phone', 'sms', 'email', 'no_preference'));