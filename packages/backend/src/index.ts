import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import configRouter from './routes/config';
import chatRouter from './routes/chat';

const app = new Koa();
const router = new Router();



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

// 注册路由
app.use(router.routes()).use(router.allowedMethods());
app.use(configRouter.routes()).use(configRouter.allowedMethods());
app.use(chatRouter.routes()).use(chatRouter.allowedMethods());

// 静态文件服务
// app.use(require('koa-static')(path.join(process.cwd(), 'data')));

// 启动服务器
console.log('running on import.meta.env.PROD', process.env.PROD);
if (process.env.PROD) {
  app.listen(3000);
  console.log('running on http://localhost:3000');
}

export const viteNodeApp = app;
