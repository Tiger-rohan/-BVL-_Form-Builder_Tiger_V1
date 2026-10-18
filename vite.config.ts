import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@formforge/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
        '@formforge/adapters': path.resolve(__dirname, 'packages/adapters/src/index.ts'),
        '@formforge/react': path.resolve(__dirname, 'packages/react/src/index.ts'),
        '@formforge/builder': path.resolve(__dirname, 'packages/builder/src/index.ts'),
        '@formforge/server': path.resolve(__dirname, 'packages/server/src/index.ts'),
        '@formforge/web-component': path.resolve(__dirname, 'packages/web-component/src/index.ts'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
