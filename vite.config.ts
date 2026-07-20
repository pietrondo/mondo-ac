import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
