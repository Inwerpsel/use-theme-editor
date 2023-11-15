import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  mode: 'development',
  root: 'docs/demo',
  // base: '/use-theme-editor',
  build: {
    target: 'es2015',
    rollupOptions: {
      input: {
        'bundle': path.resolve('docs/demo/src/index.js'),
      },
      output: {
        entryFileNames: '[name].js',
        dir: 'docs/demo/dist',
        sourcemap: true,
      },
    }
  },
  publicDir: 'docs/demo',
  // …
  plugins: [
    // …
    react({
      include: '**/*.{js,jsx,tsx}',
    }),
  ],
});
