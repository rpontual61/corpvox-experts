-- Migration: Update Experts Indications Schema
-- Description: Add employee count field and update status constraints
-- Date: 2025-12-09

-- Add quantidade_funcionarios field to experts_indications
ALTER TABLE public.experts_indications
ADD COLUMN IF NOT EXISTS quantidade_funcionarios INTEGER;

-- Drop the old status check constraint
ALTER TABLE public.experts_indications
DROP CONSTRAINT IF EXISTS experts_indications_status_check;

-- Add new status check constraint without 'em_analise' and 'beneficio_previsto'
ALTER TABLE public.experts_indications
ADD CONSTRAINT experts_indications_status_check
CHECK (status IN (
  'aguardando_validacao',
  'validacao_recusada',
  'em_contato',
  'contratou',
  'liberado_envio_nf',
  'nf_enviada',
  'pago'
));

-- Update any existing records with removed statuses to appropriate alternatives
-- 'em_analise' -> 'em_contato'
UPDATE public.experts_indications
SET status = 'em_contato'
WHERE status = 'em_analise';

-- 'beneficio_previsto' -> 'contratou'
UPDATE public.experts_indications
SET status = 'contratou'
WHERE status = 'beneficio_previsto';
