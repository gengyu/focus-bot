import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import { router as decoratorRouter, registerControllers } from './decorators/decorators.ts';
import { ChatController } from './routes/chat';
import { ConfigController } from './routes/config';
import { DcoumentController } from './routes/fileparser.route.ts';
// import {RAGController} from './routes/rag.routes';

const app = new Koa();

// 中间件配置
app.use(cors({
  origin: '*', // 允许所有来源访问
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(bodyParser());

// 健康检查接口
const healthRouter = new Router();
healthRouter.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// 注册路由
registerControllers([ChatController, ConfigController, DcoumentController]);
app.use(healthRouter.routes()).use(healthRouter.allowedMethods());
app.use(decoratorRouter.routes()).use(decoratorRouter.allowedMethods());
// app.use(ragRouter.routes()).use(ragRouter.allowedMethods());
// app.use(knowledgeRouter.routes()).use(knowledgeRouter.allowedMethods());

// 静态文件服务
// app.use(require('koa-static')(path.join(process.cwd(), 'data')));

// 启动服务器
console.log('running on import.meta.env.PROD', process.env.PROD);

app.listen(process.env.PROD || 3001);
console.log('running on http://localhost:3001');

export const viteNodeApp = app;
