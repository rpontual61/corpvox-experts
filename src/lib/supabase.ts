import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper functions for Experts

/**
 * Get current expert user from session
 */
export const getCurrentExpert = async () => {
  try {
    const email = sessionStorage.getItem('expert_email');
    if (!email) return null;

    const { data, error } = await supabase
      .from('experts_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting current expert:', error);
    return null;
  }
};

/**
 * Check if expert can create indications
 */
export const canCreateIndications = async (expertId: string): Promise<boolean> => {
  try {
    const { data: expert, error } = await supabase
      .from('experts_users')
      .select('status, curso_concluido, aceitou_termo_adesao_em, aceitou_politica_uso_em, chave_pix_empresa')
      .eq('id', expertId)
      .single();

    if (error) throw error;

    return (
      expert.status === 'aprovado' &&
      expert.curso_concluido === true &&
      expert.aceitou_termo_adesao_em !== null &&
      expert.aceitou_politica_uso_em !== null &&
      expert.chave_pix_empresa !== null
    );
  } catch (error) {
    console.error('Error checking if expert can create indications:', error);
    return false;
  }
};

/**
 * Generate OTP code (6 digits)
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email (this would integrate with your email service)
 */
export const sendOTPEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, just log to console
    console.log(`OTP Code for ${email}: ${code}`);

    // In production, call your email service API here
    // Example:
    // await fetch('/api/send-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, code })
    // });

    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

/**
 * Create and send OTP
 */
export const createOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if user exists
    const { data: expert } = await supabase
      .from('experts_users')
      .select('id')
      .eq('email', email)
      .single();

    const code = generateOTP();
    const validoAte = new Date();
    validoAte.setMinutes(validoAte.getMinutes() + 15); // Valid for 15 minutes

    // Insert OTP
    const { error } = await supabase
      .from('experts_otps')
      .insert({
        expert_id: expert?.id || null,
        email,
        codigo: code,
        valido_ate: validoAte.toISOString(),
        usado: false,
      });

    if (error) throw error;

    // Send email
    const emailSent = await sendOTPEmail(email, code);
    if (!emailSent) {
      return { success: false, error: 'Erro ao enviar e-mail' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating OTP:', error);
    return { success: false, error: 'Erro ao criar código OTP' };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Find valid OTP
    const { data: otp, error: otpError } = await supabase
      .from('experts_otps')
      .select('*')
      .eq('email', email)
      .eq('codigo', code)
      .eq('usado', false)
      .gte('valido_ate', new Date().toISOString())
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otp) {
      return { success: false, error: 'Código inválido ou expirado' };
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('experts_otps')
      .update({ usado: true })
      .eq('id', otp.id);

    if (updateError) throw updateError;

    // Store email in session
    sessionStorage.setItem('expert_email', email);

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Erro ao verificar código' };
  }
};

/**
 * Logout expert
 */
export const logoutExpert = () => {
  sessionStorage.removeItem('expert_email');
};

/**
 * Check if expert is logged in
 */
export const isExpertLoggedIn = (): boolean => {
  return !!sessionStorage.getItem('expert_email');
};

/**
 * Get expert's IP address
 */
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
};

/**
 * Storage helpers for expert NF files
 */
export const uploadExpertNF = async (
  expertId: string,
  benefitId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${benefitId}_${Date.now()}.${fileExt}`;
  const filePath = `${expertId}/${fileName}`;

  const { error } = await supabase.storage
    .from('experts-nf')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return filePath;
};

/**
 * Get NF file URL
 */
export const getExpertNFUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('experts-nf')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Format currency (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Format date (Brazilian format)
 */
export const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

/**
 * Format CNPJ
 */
export const formatCNPJ = (cnpj: string): string => {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

/**
 * Validate CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validate check digits
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

/**
 * Get indication status display name
 */
export const getIndicationStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    aguardando_validacao: 'Aguardando Validação',
    validacao_recusada: 'Validação Recusada',
    em_contato: 'Em Contato',
    em_analise: 'Em Análise',
    contratou: 'Contratou',
    beneficio_previsto: 'Benefício Previsto',
    liberado_envio_nf: 'Liberado Envio NF',
    nf_enviada: 'NF Enviada',
    pago: 'Pago',
  };
  return statusMap[status] || status;
};

/**
 * Get indication status color
 */
export const getIndicationStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    aguardando_validacao: 'bg-yellow-100 text-yellow-800',
    validacao_recusada: 'bg-red-100 text-red-800',
    em_contato: 'bg-blue-100 text-blue-800',
    em_analise: 'bg-purple-100 text-purple-800',
    contratou: 'bg-green-100 text-green-800',
    beneficio_previsto: 'bg-indigo-100 text-indigo-800',
    liberado_envio_nf: 'bg-teal-100 text-teal-800',
    nf_enviada: 'bg-cyan-100 text-cyan-800',
    pago: 'bg-emerald-100 text-emerald-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
