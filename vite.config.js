import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          'ui-vendor':  ['framer-motion', 'lucide-react', 'sonner'],
          'supabase':   ['@supabase/supabase-js'],
          'date-fns':   ['date-fns'],
        },
      },
    },
  },
})
