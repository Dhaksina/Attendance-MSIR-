import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uq3i0xvrqb2QDDNr60yYCQ_4b6T1R1x',
};

const getStoredSupabaseConfig = () => {
  try {
    const stored = localStorage.getItem('msir_supabase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {
    url: DEFAULT_SUPABASE_CONFIG.url,
    key: DEFAULT_SUPABASE_CONFIG.key,
  };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  const url = config.url || DEFAULT_SUPABASE_CONFIG.url;
  const key = config.key || DEFAULT_SUPABASE_CONFIG.key;

  if (!url || !key || url.includes('your-project') || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, key);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('msir_supabase_config', JSON.stringify({ url, key }));
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseClient() !== null;
};
