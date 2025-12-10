-- SQL Final: Migrar nf_enviada e criar constraint correta

-- 1. Migrar o registro com 'nf_enviada' para 'aguardando_conferencia'
UPDATE experts_benefits
SET status = 'aguardando_conferencia'
WHERE status = 'nf_enviada';

-- 2. Remover constraint antiga
ALTER TABLE experts_benefits
DROP CONSTRAINT IF EXISTS experts_benefits_status_check;

-- 3. Criar nova constraint com todos os 6 status
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

-- 4. Verificar resultado final
SELECT
  status,
  COUNT(*) as quantidade
FROM experts_benefits
GROUP BY status
ORDER BY quantidade DESC;
