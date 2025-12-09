-- Migration: Create Admin Tables
-- Description: Creates admin users table and authentication system for observatory
-- Date: 2025-12-09

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.experts_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Sessions Table (for session management)
CREATE TABLE IF NOT EXISTS public.experts_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.experts_admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  valido_ate TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Activity Log (audit trail)
CREATE TABLE IF NOT EXISTS public.experts_admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.experts_admin_users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL, -- 'login', 'logout', 'validate_indication', 'reject_indication', 'update_benefit', etc.
  entidade_tipo TEXT, -- 'indication', 'benefit', 'expert', etc.
  entidade_id UUID,
  detalhes JSONB, -- JSON with additional details
  ip_address TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_experts_admin_users_username ON public.experts_admin_users(username);
CREATE INDEX IF NOT EXISTS idx_experts_admin_sessions_token ON public.experts_admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_experts_admin_sessions_admin_id ON public.experts_admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_experts_admin_activity_log_admin_id ON public.experts_admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_experts_admin_activity_log_entidade ON public.experts_admin_activity_log(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_experts_admin_activity_log_criado_em ON public.experts_admin_activity_log(criado_em);

-- Trigger to update atualizado_em
DROP TRIGGER IF EXISTS trigger_update_experts_admin_users_timestamp ON public.experts_admin_users;
CREATE TRIGGER trigger_update_experts_admin_users_timestamp
  BEFORE UPDATE ON public.experts_admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_experts_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.experts_admin_sessions
  WHERE valido_ate < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.experts_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts_admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts_admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can view all data
CREATE POLICY "Admins can view all admin users" ON public.experts_admin_users
  FOR SELECT
  USING (true); -- Will be controlled by application layer

CREATE POLICY "Admins can view all sessions" ON public.experts_admin_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all activity logs" ON public.experts_admin_activity_log
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON public.experts_admin_users TO anon, authenticated;
GRANT ALL ON public.experts_admin_sessions TO anon, authenticated;
GRANT ALL ON public.experts_admin_activity_log TO anon, authenticated;

-- Insert default admin user
-- Note: The password is stored in plain text for simplicity
-- The application will accept this password directly without hashing
INSERT INTO public.experts_admin_users (username, password_hash, nome, email)
VALUES (
  'admin',
  'R@phapontuau0203', -- Plain text password - will be validated directly
  'Administrador',
  'admin@corpvox.com.br'
)
ON CONFLICT (username) DO NOTHING;
