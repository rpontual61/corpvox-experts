import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to get current user's profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
};

// Helper function to get current user's company_id
export const getCurrentUserCompanyId = async (): Promise<string | null> => {
  const profile = await getCurrentUserProfile();
  return profile?.company_id || null;
};

// Helper function to check if user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const profile = await getCurrentUserProfile();
  return profile?.user_role === 'admin';
};
