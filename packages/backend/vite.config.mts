import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import { Logger, LogLevel } from 'vite';

export default defineConfig({
  server:{
    port:3000,
    // logLevel: 'info',
    hmr:   true,
    // 自定义日志配置，确保所有控制台输出都能显示
    // customLogger: {
    //   info: (msg) => console.log(msg),
    //   warn: (msg) => console.warn(msg),
    //   error: (msg) => console.error(msg),
    //   warnOnce: (msg) => console.warn(msg),
    //   clearScreen: () => {}
    // }
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'koa',
      appPath: './src/index.ts',
      exportName: 'viteNodeApp',
      tsCompiler: 'esbuild',
      initAppOnBoot: true
    })
  ]
});