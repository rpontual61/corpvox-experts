import { supabase } from './supabase';
import { AdminUser } from '../types/database.types';

/**
 * Generate a simple hash for password comparison
 * Note: This is a simplified version. In production, use proper bcrypt on backend
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Generate random session token
 */
const generateToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Get client IP address
 */
const getClientIP = async (): Promise<string> => {
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
 * Admin login
 */
export const adminLogin = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; admin?: AdminUser }> => {
  try {
    // For now, we'll use a simple comparison
    // In production, you should implement proper password hashing on backend
    const { data: admin, error } = await supabase
      .from('experts_admin_users')
      .select('*')
      .eq('username', username)
      .eq('ativo', true)
      .single();

    if (error || !admin) {
      return { success: false, error: 'Usuário ou senha inválidos' };
    }

    // Simple password check - direct comparison
    // The password is stored in plain text in password_hash field
    if (password !== admin.password_hash) {
      return { success: false, error: 'Usuário ou senha inválidos' };
    }

    // Create session
    const token = generateToken();
    const validoAte = new Date();
    validoAte.setHours(validoAte.getHours() + 8); // 8 hours session

    const ip = await getClientIP();
    const userAgent = navigator.userAgent;

    const { error: sessionError } = await supabase
      .from('experts_admin_sessions')
      .insert({
        admin_id: admin.id,
        token,
        valido_ate: validoAte.toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: 'Erro ao criar sessão' };
    }

    // Update last access
    await supabase
      .from('experts_admin_users')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', admin.id);

    // Log activity
    await logAdminActivity(admin.id, 'login', null, null, { ip_address: ip });

    // Store session in localStorage
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));

    return { success: true, admin };
  } catch (error) {
    console.error('Error during admin login:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
};

/**
 * Verify admin session
 */
export const verifyAdminSession = async (): Promise<AdminUser | null> => {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;

    const { data: session, error } = await supabase
      .from('experts_admin_sessions')
      .select('*, experts_admin_users(*)')
      .eq('token', token)
      .gte('valido_ate', new Date().toISOString())
      .single();

    if (error || !session) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      return null;
    }

    return session.experts_admin_users as unknown as AdminUser;
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return null;
  }
};

/**
 * Admin logout
 */
export const adminLogout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');

    if (token) {
      // Delete session from database
      await supabase
        .from('experts_admin_sessions')
        .delete()
        .eq('token', token);

      // Log activity
      if (adminUser) {
        const admin = JSON.parse(adminUser);
        await logAdminActivity(admin.id, 'logout', null, null, {});
      }
    }

    // Clear localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  } catch (error) {
    console.error('Error during admin logout:', error);
  }
};

/**
 * Check if admin is logged in
 */
export const isAdminLoggedIn = (): boolean => {
  return !!localStorage.getItem('admin_token');
};

/**
 * Get current admin user from localStorage
 */
export const getCurrentAdmin = (): AdminUser | null => {
  const adminUser = localStorage.getItem('admin_user');
  return adminUser ? JSON.parse(adminUser) : null;
};

/**
 * Log admin activity
 */
export const logAdminActivity = async (
  adminId: string,
  acao: string,
  entidadeTipo: string | null,
  entidadeId: string | null,
  detalhes: any
): Promise<void> => {
  try {
    const ip = await getClientIP();

    await supabase
      .from('experts_admin_activity_log')
      .insert({
        admin_id: adminId,
        acao,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        detalhes,
        ip_address: ip,
      });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};
