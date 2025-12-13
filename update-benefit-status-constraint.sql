-- Atualizar constraint de status para incluir novos status do workflow de conferência
-- Execute este SQL ANTES de fazer upload de NF

-- 1. Remover a constraint antiga
ALTER TABLE experts_benefits
DROP CONSTRAINT IF EXISTS experts_benefits_status_check;

-- 2. Criar nova constraint com todos os status
ALTER TABLE experts_benefits
ADD CONSTRAINT experts_benefits_status_check
CHECK (status IN (
  'aguardando_pagamento_cliente',
  'liberado_para_nf',
  'aguardando_conferencia',
  'nf_recusada',
  'processando_pagamento',
  'pago'
));

-- 3. Verificar que a constraint foi criada
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'experts_benefits'
AND con.conname = 'experts_benefits_status_check';
