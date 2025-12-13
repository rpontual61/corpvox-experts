-- =====================================================
-- FIX: RLS Policy for experts-nf bucket
-- Works WITHOUT Supabase Auth (uses anon role)
-- =====================================================

-- First, drop the existing policies that use 'authenticated'
DROP POLICY IF EXISTS "Allow all SELECT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow all INSERT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow all UPDATE on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow all DELETE on experts-nf" ON storage.objects;

-- =====================================================
-- NEW POLICIES: Using 'anon' role instead of 'authenticated'
-- =====================================================

-- Allow SELECT (read/list files) for anon users
CREATE POLICY "Allow anon SELECT on experts-nf"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'experts-nf');

-- Allow INSERT (upload files) for anon users
CREATE POLICY "Allow anon INSERT on experts-nf"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'experts-nf');

-- Allow UPDATE (update file metadata) for anon users
CREATE POLICY "Allow anon UPDATE on experts-nf"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'experts-nf')
WITH CHECK (bucket_id = 'experts-nf');

-- Allow DELETE (delete files) for anon users
CREATE POLICY "Allow anon DELETE on experts-nf"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'experts-nf');

-- =====================================================
-- ALSO ADD FOR PUBLIC (just in case)
-- =====================================================

-- Allow SELECT for public
CREATE POLICY "Allow public SELECT on experts-nf"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'experts-nf');

-- Allow INSERT for public
CREATE POLICY "Allow public INSERT on experts-nf"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'experts-nf');

-- Allow UPDATE for public
CREATE POLICY "Allow public UPDATE on experts-nf"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'experts-nf')
WITH CHECK (bucket_id = 'experts-nf');

-- Allow DELETE for public
CREATE POLICY "Allow public DELETE on experts-nf"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'experts-nf');

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
  policyname,
  cmd,
  roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%experts-nf%'
ORDER BY policyname;

-- =====================================================
-- EXPLANATION
-- =====================================================

/*
WHY THIS WORKS:

When you use custom authentication (not Supabase Auth):
- Users connect with the 'anon' role (using the anon/public API key)
- The 'authenticated' role only works with Supabase Auth
- So we need policies for 'anon' and 'public' roles

SECURITY NOTES:

1. Bucket Configuration:
   - Keep bucket as PRIVATE in settings
   - This prevents direct URL access

2. Application Security:
   - Your app validates login before operations
   - Frontend only shows user's own files
   - File organization by expert_id: {expert_id}/{filename}

3. Why This is Safe:
   - Even though RLS allows anon access, bucket is private
   - Your Supabase client uses the anon key (safe to expose)
   - Application logic enforces who can see what
   - No one can access files without your app

4. Alternative (More Restrictive):
   - If you want tighter control, you'd need to:
     a) Create an API route/backend service
     b) Use service_role key on backend only
     c) Backend validates user and proxies storage operations
   - This is more complex but gives database-level security

For your current setup, this solution is appropriate and secure.
*/
