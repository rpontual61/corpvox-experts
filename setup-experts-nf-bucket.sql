-- =====================================================
-- Setup Storage Bucket for Expert NF (Notas Fiscais)
-- =====================================================

-- 1. Create the bucket (if not already created via UI)
-- Note: You can also create this via Supabase Dashboard > Storage > New Bucket
-- Bucket name: experts-nf
-- Public: NO (keep it private)

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES FOR EXPERTS
-- =====================================================

-- Policy 1: Experts can upload their own NF files
CREATE POLICY "Experts can upload their own NF files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'experts-nf'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM experts_users
    WHERE id = auth.uid()
  )
);

-- Policy 2: Experts can read their own NF files
CREATE POLICY "Experts can read their own NF files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM experts_users
    WHERE id = auth.uid()
  )
);

-- Policy 3: Experts can update their own NF files
CREATE POLICY "Experts can update their own NF files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM experts_users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'experts-nf'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Experts can delete their own NF files
CREATE POLICY "Experts can delete their own NF files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM experts_users
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- POLICIES FOR ADMINS
-- =====================================================

-- Policy 5: Admins can read all NF files
CREATE POLICY "Admins can read all NF files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
  )
);

-- Policy 6: Admins can update all NF files
CREATE POLICY "Admins can update all NF files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'experts-nf'
);

-- Policy 7: Admins can delete all NF files
CREATE POLICY "Admins can delete all NF files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'experts-nf'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies were created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%NF%'
ORDER BY policyname;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
PASSOS PARA CONFIGURAR O BUCKET:

1. Via Supabase Dashboard:
   - Acesse: Supabase Dashboard > Storage > New Bucket
   - Nome: experts-nf
   - Public: NO (desmarcar)
   - Clique em "Create bucket"

2. Execute este script SQL:
   - Acesse: Supabase Dashboard > SQL Editor
   - Cole todo este script
   - Clique em "Run"

3. Verifique se funcionou:
   - Execute a query de verificação no final
   - Você deve ver 7 políticas criadas

ESTRUTURA DE ARQUIVOS:
- O caminho dos arquivos será: {expert_id}/{benefit_id}_{timestamp}.{ext}
- Exemplo: a1b2c3d4-e5f6-7890-abcd-ef1234567890/b9c8d7e6-5432-1098-fedc-ba0987654321_1704828000000.pdf

SEGURANÇA:
- Cada expert só pode acessar arquivos na sua própria pasta (expert_id)
- Admins podem acessar todos os arquivos
- O bucket é privado - não há acesso público
- Todas as operações requerem autenticação

*/
