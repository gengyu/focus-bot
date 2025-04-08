import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  server:{
    port:3000,
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'koa',
      appPath: './src/index.ts',
      exportName: 'viteNodeApp',
      tsCompiler: 'esbuild'
    })
  ]
});