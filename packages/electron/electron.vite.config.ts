import { defineConfig } from 'electron-vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron-store']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron-store']
      }
    }
  },
  renderer: {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve('src/renderer')
      }
    },
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer')
        ]
      }
    }
  }
})