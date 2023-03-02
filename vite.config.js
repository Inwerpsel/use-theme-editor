import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  mode: 'development',
  root: 'docs',
  build: {
    target: 'es2015',
    rollupOptions: {
      input: {
        'bundle': path.resolve('docs/src/index.js'),
      },
      output: {
        entryFileNames: '[name].js',
        dir: 'docs/dist',
        sourcemap: true,
      },
    }
  },
  publicDir: 'docs',
  // …
  plugins: [
    // …
    react({
      include: '**/*.{js,jsx,tsx}',
    }),
  ],
});
