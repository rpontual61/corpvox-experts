-- First, let's see the current benefits data
SELECT
  id,
  indication_id,
  status,
  data_contrato_cliente,
  data_primeiro_pagamento_cliente,
  pode_enviar_nf_a_partir_de,
  data_prevista_pagamento_beneficio
FROM experts_benefits
ORDER BY id DESC
LIMIT 5;

-- If you see any benefit with status 'liberado_para_nf' that should be 'aguardando_pagamento_cliente',
-- update it with the command below (replace <benefit_id> with the actual ID):

-- UPDATE experts_benefits
-- SET status = 'aguardando_pagamento_cliente'
-- WHERE id = <benefit_id>;

-- Or if you want to update ALL benefits that are 'liberado_para_nf' back to 'aguardando_pagamento_cliente':

-- UPDATE experts_benefits
-- SET status = 'aguardando_pagamento_cliente'
-- WHERE status = 'liberado_para_nf';
