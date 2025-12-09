-- Migration: Add CRM status column to experts_indications
-- Description: Adds a CRM status field to track sales pipeline stages for indications

-- Add CRM status column
ALTER TABLE public.experts_indications
ADD COLUMN IF NOT EXISTS crm_status TEXT
CHECK (crm_status IN (
  'contato_inicial',
  'apresentacao_marcada',
  'apresentacao_feita',
  'proposta_enviada',
  'em_avaliacao',
  'negociacao',
  'contrato_enviado',
  'contrato_assinado'
));

-- Add index for better query performance on CRM views
CREATE INDEX IF NOT EXISTS idx_experts_indications_crm_status
ON public.experts_indications(crm_status)
WHERE crm_status IS NOT NULL;

-- Add index for combined status + crm_status queries
CREATE INDEX IF NOT EXISTS idx_experts_indications_status_crm
ON public.experts_indications(status, crm_status);

-- Add comment
COMMENT ON COLUMN public.experts_indications.crm_status IS 'CRM pipeline stage for indications in "em_contato" status';
