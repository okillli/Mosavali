import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // loadEnv reads from .env files (local dev)
    const fileEnv = loadEnv(mode, '.', '');

    // Helper: check .env file first, then actual process.env (Vercel)
    const getEnv = (key: string) => fileEnv[key] || process.env[key] || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(getEnv('GEMINI_API_KEY')),
        'process.env.GEMINI_API_KEY': JSON.stringify(getEnv('GEMINI_API_KEY')),
        // Support both NEXT_PUBLIC_ and VITE_ prefixes for flexibility
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
          getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL')
        ),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
          getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'next/navigation': path.resolve(__dirname, 'lib/navigation.ts'),
          'next/link': path.resolve(__dirname, 'lib/link.tsx'),
        }
      }
    };
});
