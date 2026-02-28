import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        events: resolve(__dirname, 'events.html'),
        event: resolve(__dirname, 'event.html'),
        luke: resolve(__dirname, 'luke/index.html'),
        mus: resolve(__dirname, 'mus/index.html'),
      },
    },
  },
});