import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration with alias mappings for React Native Web & Skia
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'window',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
