import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        cuenta: resolve(__dirname, 'cuenta.html'),
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
});
