
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-logos', 'vendor-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload vendor logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-logos');

CREATE POLICY "Authenticated users can update own vendor logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vendor-logos')
WITH CHECK (bucket_id = 'vendor-logos');

CREATE POLICY "Anyone can read vendor logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-logos');
