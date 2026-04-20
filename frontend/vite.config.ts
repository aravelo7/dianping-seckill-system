import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/user': 'http://localhost:8081',
      '/shop': 'http://localhost:8081',
      '/voucher-order': 'http://localhost:8081',
      '/admin': 'http://localhost:8081'
    }
  }
});
