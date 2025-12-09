-- Migration: Add 'perdido' status to indication status
-- Description: Adds 'perdido' (lost) status to track lost opportunities in indications

-- Drop the existing constraint
ALTER TABLE public.experts_indications
DROP CONSTRAINT IF EXISTS experts_indications_status_check;

-- Add new constraint with 'perdido' status
ALTER TABLE public.experts_indications
ADD CONSTRAINT experts_indications_status_check
CHECK (status IN (
  'aguardando_validacao',
  'validacao_recusada',
  'em_contato',
  'contratou',
  'perdido'
));
