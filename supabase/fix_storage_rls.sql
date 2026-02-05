-- =====================================================
-- Storage RLS Fix for Photo Upload
-- Run this in Supabase Dashboard SQL Editor
-- =====================================================

-- Remove old restrictive policies
DROP POLICY IF EXISTS "Agents can upload listing media" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view own listing media" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own listing media" ON storage.objects;

-- New policies (allow all authenticated users)
CREATE POLICY "Authenticated users can upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view listing media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-media');

CREATE POLICY "Authenticated users can delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'listing-media' AND auth.role() = 'authenticated');
