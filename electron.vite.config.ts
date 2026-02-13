// electron.vite.config.ts
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import { alias } from 'vite-plugin-alias';

// Define the Vite configuration
export default defineConfig({
  plugins: [createVuePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: './src/main.ts',
        preload: './src/preload.ts',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});