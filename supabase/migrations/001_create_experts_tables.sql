-- Migration: Create Experts Tables
-- Description: Creates all necessary tables for the Corpvox Experts program
-- Schema: public

-- 1. Experts Users Table
CREATE TABLE IF NOT EXISTS public.experts_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  telefone_whatsapp TEXT,
  tipo_perfil TEXT CHECK (tipo_perfil IN ('sst', 'business')),
  empresa_nome TEXT,
  empresa_cnpj TEXT,

  -- Pesquisa / pré-qualificação
  qtd_empresas_atendidas INTEGER,
  pode_emitir_nf BOOLEAN DEFAULT false,
  possui_vinculo_clt BOOLEAN DEFAULT false,
  detalhes_vinculo_clt TEXT,

  -- Curso obrigatório
  curso_concluido BOOLEAN DEFAULT false,
  curso_concluido_em TIMESTAMP WITH TIME ZONE,

  -- Status do Expert
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'suspenso')),
  motivo_status TEXT,

  -- Dados bancários (PIX)
  chave_pix_empresa TEXT,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cpf', 'cnpj', 'email', 'telefone', 'chave_aleatoria')),

  -- Termos e políticas
  aceitou_termo_adesao_em TIMESTAMP WITH TIME ZONE,
  aceitou_termo_adesao_ip TEXT,
  aceitou_politica_uso_em TIMESTAMP WITH TIME ZONE,
  aceitou_politica_uso_ip TEXT,

  -- Outros
  origem_cadastro TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_experts_users_email ON public.experts_users(email);
CREATE INDEX IF NOT EXISTS idx_experts_users_status ON public.experts_users(status);

-- 2. Experts OTPs Table
CREATE TABLE IF NOT EXISTS public.experts_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES public.experts_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  codigo TEXT NOT NULL,
  valido_ate TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for OTP lookups
CREATE INDEX IF NOT EXISTS idx_experts_otps_email ON public.experts_otps(email);
CREATE INDEX IF NOT EXISTS idx_experts_otps_codigo ON public.experts_otps(codigo);
CREATE INDEX IF NOT EXISTS idx_experts_otps_valido_ate ON public.experts_otps(valido_ate);

-- 3. Experts Indications Table
CREATE TABLE IF NOT EXISTS public.experts_indications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.experts_users(id) ON DELETE CASCADE,
  empresa_nome TEXT NOT NULL,
  empresa_cnpj TEXT NOT NULL,
  contato_nome TEXT NOT NULL,
  contato_email TEXT,
  contato_whatsapp TEXT,
  tipo_indicacao TEXT CHECK (tipo_indicacao IN ('relatorio_tecnico', 'email', 'whatsapp_conversa')),
  observacoes TEXT,

  -- Status da indicação
  status TEXT DEFAULT 'aguardando_validacao' CHECK (status IN (
    'aguardando_validacao',
    'validacao_recusada',
    'em_contato',
    'em_analise',
    'contratou',
    'beneficio_previsto',
    'liberado_envio_nf',
    'nf_enviada',
    'pago'
  )),
  motivo_recusa TEXT,
  validada_em TIMESTAMP WITH TIME ZONE,
  validada_por UUID, -- Reference to admin user who validated

  -- Regra dos 90 dias
  data_expiracao_indicacao TIMESTAMP WITH TIME ZONE,
  expirou BOOLEAN DEFAULT false,

  -- Vínculo com cliente interno
  contrato_id UUID, -- Reference to contract in main system if exists

  -- Auditoria
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for indications
CREATE INDEX IF NOT EXISTS idx_experts_indications_expert_id ON public.experts_indications(expert_id);
CREATE INDEX IF NOT EXISTS idx_experts_indications_status ON public.experts_indications(status);
CREATE INDEX IF NOT EXISTS idx_experts_indications_cnpj ON public.experts_indications(empresa_cnpj);
CREATE INDEX IF NOT EXISTS idx_experts_indications_expiracao ON public.experts_indications(data_expiracao_indicacao);

-- 4. Experts Benefits Table
CREATE TABLE IF NOT EXISTS public.experts_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.experts_users(id) ON DELETE CASCADE,
  indication_id UUID NOT NULL REFERENCES public.experts_indications(id) ON DELETE CASCADE,

  -- Cálculo do benefício
  valor_mensalidade_cliente NUMERIC(10, 2),
  multiplicador_interno NUMERIC(4, 2), -- Not visible to Expert
  valor_beneficio NUMERIC(10, 2),

  -- Datas chave
  data_contrato_cliente DATE,
  data_primeiro_pagamento_cliente DATE,
  data_prevista_pagamento_beneficio DATE,
  pode_enviar_nf_a_partir_de DATE,

  -- Nota fiscal do Expert
  nf_enviada BOOLEAN DEFAULT false,
  nf_data_emissao DATE,
  nf_valor NUMERIC(10, 2),
  nf_arquivo_url TEXT,
  nf_enviada_em TIMESTAMP WITH TIME ZONE,

  -- Pagamento ao Expert
  pagamento_realizado BOOLEAN DEFAULT false,
  pagamento_data DATE,

  -- Auditoria
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for benefits
CREATE INDEX IF NOT EXISTS idx_experts_benefits_expert_id ON public.experts_benefits(expert_id);
CREATE INDEX IF NOT EXISTS idx_experts_benefits_indication_id ON public.experts_benefits(indication_id);
CREATE INDEX IF NOT EXISTS idx_experts_benefits_pode_enviar_nf ON public.experts_benefits(pode_enviar_nf_a_partir_de);

-- Function to automatically set data_expiracao_indicacao (90 days from creation)
CREATE OR REPLACE FUNCTION set_indication_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_expiracao_indicacao := NEW.criado_em + INTERVAL '90 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiration date on indication creation
DROP TRIGGER IF EXISTS trigger_set_indication_expiration ON public.experts_indications;
CREATE TRIGGER trigger_set_indication_expiration
  BEFORE INSERT ON public.experts_indications
  FOR EACH ROW
  EXECUTE FUNCTION set_indication_expiration();

-- Function to mark expired indications
CREATE OR REPLACE FUNCTION mark_expired_indications()
RETURNS void AS $$
BEGIN
  UPDATE public.experts_indications
  SET expirou = true
  WHERE data_expiracao_indicacao < NOW()
    AND expirou = false
    AND status NOT IN ('pago', 'nf_enviada', 'liberado_envio_nf');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate benefit value
CREATE OR REPLACE FUNCTION calculate_benefit_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valor_mensalidade_cliente IS NOT NULL AND NEW.multiplicador_interno IS NOT NULL THEN
    NEW.valor_beneficio := NEW.valor_mensalidade_cliente * NEW.multiplicador_interno;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate benefit value
DROP TRIGGER IF EXISTS trigger_calculate_benefit_value ON public.experts_benefits;
CREATE TRIGGER trigger_calculate_benefit_value
  BEFORE INSERT OR UPDATE OF valor_mensalidade_cliente, multiplicador_interno ON public.experts_benefits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_benefit_value();

-- Function to set payment dates
CREATE OR REPLACE FUNCTION set_benefit_payment_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_primeiro_pagamento_cliente IS NOT NULL THEN
    -- Pagamento no dia 15 do mês do primeiro pagamento
    NEW.data_prevista_pagamento_beneficio := DATE_TRUNC('month', NEW.data_primeiro_pagamento_cliente) + INTERVAL '14 days';
    -- Pode enviar NF a partir do dia 5 do mesmo mês
    NEW.pode_enviar_nf_a_partir_de := DATE_TRUNC('month', NEW.data_primeiro_pagamento_cliente) + INTERVAL '4 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set payment dates
DROP TRIGGER IF EXISTS trigger_set_benefit_payment_dates ON public.experts_benefits;
CREATE TRIGGER trigger_set_benefit_payment_dates
  BEFORE INSERT OR UPDATE OF data_primeiro_pagamento_cliente ON public.experts_benefits
  FOR EACH ROW
  EXECUTE FUNCTION set_benefit_payment_dates();

-- Function to update atualizado_em timestamp
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update atualizado_em on all tables
DROP TRIGGER IF EXISTS trigger_update_experts_users_timestamp ON public.experts_users;
CREATE TRIGGER trigger_update_experts_users_timestamp
  BEFORE UPDATE ON public.experts_users
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS trigger_update_experts_indications_timestamp ON public.experts_indications;
CREATE TRIGGER trigger_update_experts_indications_timestamp
  BEFORE UPDATE ON public.experts_indications
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS trigger_update_experts_benefits_timestamp ON public.experts_benefits;
CREATE TRIGGER trigger_update_experts_benefits_timestamp
  BEFORE UPDATE ON public.experts_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Enable Row Level Security (RLS)
ALTER TABLE public.experts_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts_indications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experts_users
-- Experts can only see their own data
CREATE POLICY "Experts can view own data" ON public.experts_users
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Experts can update own data" ON public.experts_users
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for experts_indications
-- Experts can only see their own indications
CREATE POLICY "Experts can view own indications" ON public.experts_indications
  FOR SELECT
  USING (expert_id IN (SELECT id FROM public.experts_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Experts can create own indications" ON public.experts_indications
  FOR INSERT
  WITH CHECK (expert_id IN (SELECT id FROM public.experts_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- RLS Policies for experts_benefits
-- Experts can only see their own benefits
CREATE POLICY "Experts can view own benefits" ON public.experts_benefits
  FOR SELECT
  USING (expert_id IN (SELECT id FROM public.experts_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.experts_users TO anon, authenticated;
GRANT ALL ON public.experts_otps TO anon, authenticated;
GRANT ALL ON public.experts_indications TO anon, authenticated;
GRANT ALL ON public.experts_benefits TO anon, authenticated;
