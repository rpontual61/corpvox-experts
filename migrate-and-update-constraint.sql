-- Migrar dados antigos e atualizar constraint
-- Este SQL faz tudo de uma vez: migra registros antigos e cria a nova constraint

-- 1. Primeiro, vamos ver o que existe
SELECT
  status,
  COUNT(*) as quantidade
FROM experts_benefits
GROUP BY status
ORDER BY quantidade DESC;

-- 2. Migrar registros com status antigo 'nf_enviada' para 'aguardando_conferencia'
-- (assumindo que são NFs enviadas mas ainda não processadas)
UPDATE experts_benefits
SET status = 'aguardando_conferencia'
WHERE status = 'nf_enviada';

-- 3. Se houver outros status inválidos, liste aqui:
-- (Descomente e ajuste conforme necessário)
-- UPDATE experts_benefits SET status = 'pago' WHERE status = 'outro_status_antigo';

-- 4. Remover constraint antiga
ALTER TABLE experts_benefits
DROP CONSTRAINT IF EXISTS experts_benefits_status_check;

-- 5. Criar nova constraint
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

-- 6. Verificar resultado
SELECT
  status,
  COUNT(*) as quantidade
FROM experts_benefits
GROUP BY status
ORDER BY quantidade DESC;
