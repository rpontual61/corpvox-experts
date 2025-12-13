-- Update existing benefits to change pode_enviar_nf_a_partir_de from day 5 to day 6
-- This updates all benefits where the date is set to the 5th of the month to the 6th

UPDATE experts_benefits
SET pode_enviar_nf_a_partir_de =
  CASE
    WHEN EXTRACT(DAY FROM pode_enviar_nf_a_partir_de::date) = 5 THEN
      (pode_enviar_nf_a_partir_de::date + INTERVAL '1 day')::date
    ELSE
      pode_enviar_nf_a_partir_de
  END
WHERE pode_enviar_nf_a_partir_de IS NOT NULL;

-- Show updated records
SELECT id, indication_id, data_contrato_cliente, data_primeiro_pagamento_cliente, pode_enviar_nf_a_partir_de, status
FROM experts_benefits
ORDER BY created_at DESC;
