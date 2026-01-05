import { createClient } from '@supabase/supabase-js';

// Safely access environment variables
const getEnv = (key: string) => {
  // Check process.env (Node/Next.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env (Vite/Modern browsers)
  // Casting to any to avoid TypeScript error: Property 'env' does not exist on type 'ImportMeta'.
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

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