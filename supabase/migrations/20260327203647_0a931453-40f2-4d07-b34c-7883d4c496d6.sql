-- Create storage bucket for certification files
INSERT INTO storage.buckets (id, name, public) VALUES ('certification-files', 'certification-files', false);

-- Allow authenticated users to upload certification files
CREATE POLICY "Authenticated users can upload cert files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certification-files');

-- Allow authenticated users to read own cert files
CREATE POLICY "Users can read cert files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certification-files');

-- Add certification_files jsonb column to providers
ALTER TABLE public.providers ADD COLUMN certification_files jsonb DEFAULT '{}';