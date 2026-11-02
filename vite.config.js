import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
import { basename, resolve } from 'node:path';

export default defineConfig({
  base: '/',
  build: { copyPublicDir: false },
  plugins: [react(), {
    name: 'safe-public-assets',
    apply: 'build',
    closeBundle() {
      cpSync(resolve('public'), resolve('dist'), {
        recursive: true,
        filter: (source) => {
          const name = basename(source);
          return name === '.htaccess' || (!name.startsWith('.') && name !== 'logs' && !/\.(log|sql|bak|ini|zip)$/i.test(name));
        }
      });
      cpSync(resolve('router.php'), resolve('dist/router.php'));
    }
  }],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
