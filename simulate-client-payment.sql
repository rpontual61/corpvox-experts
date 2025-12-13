-- Simulate that the client paid on 05/01/2026
-- Change benefit status from 'aguardando_pagamento_cliente' to 'liberado_para_nf'

UPDATE experts_benefits
SET
  status = 'liberado_para_nf',
  cliente_pagou_em = '2026-01-05'
WHERE status = 'aguardando_pagamento_cliente';

-- Verify the update
SELECT
  id,
  indication_id,
  status,
  data_contrato_cliente,
  data_primeiro_pagamento_cliente,
  pode_enviar_nf_a_partir_de,
  data_prevista_pagamento_beneficio,
  cliente_pagou_em
FROM experts_benefits
ORDER BY id DESC
LIMIT 5;
