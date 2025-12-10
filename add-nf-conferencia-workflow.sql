-- Migration: Adicionar workflow de conferência de NF
-- Descrição: Adiciona campo de justificativa de recusa e novos status ao fluxo
--
-- IMPORTANTE: Execute este SQL no SQL Editor do Supabase
--
-- Novos status do fluxo:
-- aguardando_conferencia: NF foi enviada e está aguardando conferência do admin
-- nf_recusada: NF foi recusada pelo admin (expert pode reenviar)
-- processando_pagamento: NF aprovada, pagamento está sendo processado
--
-- Fluxo completo:
-- aguardando_pagamento_cliente → liberado_para_nf → aguardando_conferencia
--                                                    ↓              ↓
--                                            nf_recusada     processando_pagamento → pago

-- 1. Adicionar coluna de justificativa de recusa
ALTER TABLE experts_benefits
ADD COLUMN IF NOT EXISTS nf_recusa_justificativa TEXT;

-- 2. Comentário explicativo
COMMENT ON COLUMN experts_benefits.nf_recusa_justificativa IS
'Justificativa do admin quando NF é recusada. Visível para o expert.';

-- 3. Verificar dados (opcional)
SELECT
  id,
  status,
  nf_enviada,
  nf_recusa_justificativa,
  nf_enviada_em
FROM experts_benefits
WHERE nf_enviada = true
ORDER BY nf_enviada_em DESC
LIMIT 10;
