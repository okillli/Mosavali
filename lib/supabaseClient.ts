import { createClient } from '@supabase/supabase-js';

// Safely access environment variables from multiple sources
const getEnv = (key: string): string => {
  // Check process.env (works with vite.config.ts define)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Check import.meta.env (Vite's native env handling)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const env = import.meta.env;
    if (env[key]) return env[key];
  }
  return '';
};

// Check multiple possible env var names for Supabase config
const supabaseUrl =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL');

const supabaseKey =
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase environment variables are missing. The app will load but cannot fetch data.\n' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.'
  );
}

// Fallback to avoid crash on init, but requests will fail if keys are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);