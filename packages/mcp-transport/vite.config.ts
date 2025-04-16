import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MCPCore',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      external: ['axios', 'dotenv'],
      output: {
        exports: 'named',
        globals: {
          axios: 'axios',
          dotenv: 'dotenv'
        }
      }
    }
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**/*'],
      outDir: 'dist'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});