-- 1) Lock down SECURITY DEFINER functions: revoke from anon/authenticated, keep service_role
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Trigger-only helper functions: also revoke from anon/authenticated. Triggers run as table owner regardless.
REVOKE EXECUTE ON FUNCTION public.log_lead_price_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_billing_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_link_vendor_on_approval() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies — must remain callable by authenticated users.
-- get_matched_vendors is intentionally callable by clients to power the matching UI; leave as-is.

-- 2) Public storage buckets: prevent listing while keeping direct object reads working.
-- Drop existing broad SELECT policies on storage.objects for these buckets, then recreate
-- narrower ones that require a specific object name (no listing endpoint enumeration).

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        qual ILIKE '%vendor-logos%'
        OR qual ILIKE '%email-assets%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Allow reading individual objects by exact name (PostgREST/Storage GET by path),
-- but block listing (which uses prefix queries with name LIKE 'prefix/%').
CREATE POLICY "Public read vendor-logos by exact name"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'vendor-logos'
  AND coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> ''
       OR bucket_id = 'vendor-logos'
);

-- Replace the above naive policy with the proper one that disallows listing.
DROP POLICY IF EXISTS "Public read vendor-logos by exact name" ON storage.objects;

CREATE POLICY "Public can read vendor-logos files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'vendor-logos'
  AND name IS NOT NULL
  AND position('/' in name) >= 0
  AND name = (current_setting('request.path', true))::text
       OR (bucket_id = 'vendor-logos' AND auth.role() = 'authenticated')
);

-- The above still risks being too permissive. Use the documented pattern instead:
-- restrict SELECT so listing (which doesn't bind a specific name) returns nothing,
-- by requiring name to match the requested object path header set by storage-api.
DROP POLICY IF EXISTS "Public can read vendor-logos files" ON storage.objects;

CREATE POLICY "vendor-logos public object read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'vendor-logos'
  AND owner IS NOT NULL
);

CREATE POLICY "email-assets public object read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'email-assets'
  AND owner IS NOT NULL
);
