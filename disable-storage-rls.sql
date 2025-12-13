-- =====================================================
-- Disable RLS on storage.objects to allow uploads
-- without Supabase Auth
-- =====================================================

-- This is necessary because you're using custom authentication
-- (login/password in tables) instead of Supabase Auth.
-- Without this, all storage operations will fail with RLS errors.

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- Expected result: rowsecurity = false

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
SECURITY CONSIDERATIONS:

With RLS disabled on storage.objects, access control is managed by:

1. Bucket Privacy Settings:
   - Keep the 'experts-nf' bucket as PRIVATE (not public)
   - This prevents anonymous access via direct URLs

2. Application-Level Security:
   - Your app code validates user login before any operation
   - File paths include expert_id: {expert_id}/{filename}
   - Frontend only shows files for the logged-in expert
   - Admin panel can access all files

3. API Key Security:
   - Use the anon/public key in the frontend (safe to expose)
   - Never expose the service_role key in the frontend
   - Service role key should only be used in backend/admin operations

ALTERNATIVE:
If you want database-level security, you would need to:
- Migrate to Supabase Auth for user authentication
- Use auth.uid() in RLS policies
- This requires rewriting the authentication flow

For now, keeping RLS disabled is the practical solution
that works with your current custom auth setup.
*/
