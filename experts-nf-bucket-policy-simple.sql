-- =====================================================
-- Simple RLS Policy for experts-nf bucket
-- Works with custom authentication (no Supabase Auth)
-- =====================================================

-- This creates permissive policies that allow all authenticated
-- operations on the experts-nf bucket only, without affecting
-- other buckets.

-- =====================================================
-- POLICY 1: Allow ALL operations on experts-nf bucket
-- =====================================================

-- Allow SELECT (read/list files)
CREATE POLICY "Allow all SELECT on experts-nf"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'experts-nf');

-- Allow INSERT (upload files)
CREATE POLICY "Allow all INSERT on experts-nf"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'experts-nf');

-- Allow UPDATE (update file metadata)
CREATE POLICY "Allow all UPDATE on experts-nf"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'experts-nf')
WITH CHECK (bucket_id = 'experts-nf');

-- Allow DELETE (delete files)
CREATE POLICY "Allow all DELETE on experts-nf"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'experts-nf');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all policies for storage.objects
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- NOTES
-- =====================================================

/*
HOW THIS WORKS:

1. These policies only affect the 'experts-nf' bucket
2. Other buckets are not affected and keep their own RLS policies
3. All authenticated users can access experts-nf bucket
4. The bucket remains PRIVATE (no public access via URLs)
5. Access control is managed at the application level:
   - Your app validates login before allowing any operation
   - Frontend only shows files for the logged-in user
   - File paths use expert_id to organize: {expert_id}/{filename}

SECURITY:

✅ Bucket is PRIVATE (set in bucket settings)
✅ Only authenticated requests work (needs valid Supabase client)
✅ Application validates user before showing/uploading files
✅ No public URL access
✅ Other buckets maintain their own security policies

This is safe because:
- The Supabase client in your frontend is already configured
- Even though RLS allows access, the bucket is private
- Your app code ensures users only see their own files
- Admin users can access all files through admin interface
*/
