import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

let client: SupabaseClient | null = null;

const getSupabaseConfig = () => {
  const extra = (Constants.expoConfig?.extra || {}) as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };

  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY || extra.supabaseAnonKey,
  };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (client) return client;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return client;
};

