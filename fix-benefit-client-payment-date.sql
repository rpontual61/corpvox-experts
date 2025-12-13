-- The issue: data_primeiro_pagamento_cliente should be day 5, not day 6
-- Fix: Update data_primeiro_pagamento_cliente to be one day before pode_enviar_nf_a_partir_de

UPDATE experts_benefits
SET data_primeiro_pagamento_cliente = (pode_enviar_nf_a_partir_de::date - INTERVAL '1 day')::date
WHERE data_primeiro_pagamento_cliente = pode_enviar_nf_a_partir_de;

-- Verify the fix
SELECT
  id,
  indication_id,
  status,
  data_contrato_cliente,
  data_primeiro_pagamento_cliente,
  pode_enviar_nf_a_partir_de,
  data_prevista_pagamento_beneficio
FROM experts_benefits
ORDER BY id DESC;
