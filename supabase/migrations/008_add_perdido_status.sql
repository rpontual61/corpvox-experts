-- Migration: Add 'perdido' status to CRM
-- Description: Adds 'perdido' (lost) status to track lost opportunities in CRM pipeline

-- Drop the existing constraint
ALTER TABLE public.experts_indications
DROP CONSTRAINT IF EXISTS experts_indications_crm_status_check;

-- Add new constraint with 'perdido' status
ALTER TABLE public.experts_indications
ADD CONSTRAINT experts_indications_crm_status_check
CHECK (crm_status IN (
  'contato_inicial',
  'apresentacao_marcada',
  'apresentacao_feita',
  'proposta_enviada',
  'em_avaliacao',
  'negociacao',
  'contrato_enviado',
  'contrato_assinado',
  'perdido'
));
