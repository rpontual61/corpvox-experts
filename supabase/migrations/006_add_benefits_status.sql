-- Add status column to experts_benefits table
ALTER TABLE public.experts_benefits
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aguardando_pagamento_cliente' CHECK (status IN ('aguardando_pagamento_cliente', 'liberado_para_nf', 'nf_enviada', 'pago'));

-- Add cliente_pagou_em column
ALTER TABLE public.experts_benefits
ADD COLUMN IF NOT EXISTS cliente_pagou_em TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.experts_benefits.status IS 'Status do benefício: aguardando_pagamento_cliente | liberado_para_nf | nf_enviada | pago';
COMMENT ON COLUMN public.experts_benefits.cliente_pagou_em IS 'Data em que o cliente realizou o primeiro pagamento';

-- Update existing benefits based on current state
UPDATE public.experts_benefits
SET status = CASE
  WHEN pagamento_realizado = true THEN 'pago'
  WHEN nf_enviada = true THEN 'nf_enviada'
  WHEN pode_enviar_nf_a_partir_de IS NOT NULL AND pode_enviar_nf_a_partir_de <= NOW() THEN 'liberado_para_nf'
  ELSE 'aguardando_pagamento_cliente'
END
WHERE status IS NULL OR status = 'aguardando_pagamento_cliente';
