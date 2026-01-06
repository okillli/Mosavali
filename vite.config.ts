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
      // Supabase environment variables - support both prefixes
      'process.env.SUPABASE_URL': JSON.stringify(
        getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL')
      ),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(
        getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      ),
      // Legacy support for existing code
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
    },
    build: {
      // Use esbuild for fast minification
      minify: 'esbuild',

      // Disable source maps in production for smaller bundles
      sourcemap: false,

      // Split chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-icons': ['lucide-react'],
          }
        }
      },

      // Report compressed sizes
      reportCompressedSize: true,

      // Increase chunk size warning limit (we're now code-splitting)
      chunkSizeWarningLimit: 300,
    }
  };
});
