import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['apache-arrow'],
  },
  build: {
    target: 'esnext',
  },
});
