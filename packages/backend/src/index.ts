import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import {FileConfigService} from './services/configService';
import {MCPConfig} from './types/config';

const app = new Koa();
const router = new Router();
const configService = new FileConfigService();

// 中间件配置
app.use(cors({
  origin: '*', // 允许所有来源访问
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(bodyParser());

// 健康检查接口
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// 获取配置
router.get('/config', async (ctx) => {
  try {
    const config = await configService.loadConfig();
    ctx.body = config;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to load configuration'
    };
  }
});

// 保存配置
router.post('/config', async (ctx) => {
  try {
    const config: MCPConfig = ctx.request.body;
    await configService.saveConfig(config);
    ctx.body = { message: 'Configuration saved successfully' };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to save configuration'
    };
  }
});

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器

if (import.meta.env.PROD) {
  app.listen(3000);
  console.log('running on http://localhost:3000');
}

export const viteNodeApp = app;
