-- Add only CPF field to experts_users table
-- empresa_nome already exists (it's the razao social)
-- empresa_cnpj already exists
ALTER TABLE public.experts_users
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Add comment
COMMENT ON COLUMN public.experts_users.cpf IS 'CPF do expert (pessoa física)';
