import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import {FileConfigService} from './services/configService';
import {MCPConfig} from './types/config';
import {ChatService} from './services/chatService';
import multer from '@koa/multer';
import path from 'path';

const app = new Koa();
const router = new Router();
const configService = new FileConfigService();
const chatService = new ChatService();

// 初始化聊天服务
chatService.initialize().catch(error => {
  console.error('Failed to initialize chat service:', error);
});

// 配置文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'data', 'images'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});


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


// 获取MCP配置列表
router.get('/config/list', async (ctx) => {
  try {
    const configList = await configService.getConfigList();
    ctx.body = configList;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to get configuration list'
    };
  }
});

// 获取所有服务运行状态
router.get('/services/status', async (ctx) => {
  try {
    const configList = await configService.getConfigList();
    const statusList = configList.map(config => ({
      id: config.id,
      name: config.name,
      isRunning: config.isRunning
    }));
    ctx.body = statusList;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to get services status'
    };
  }
});

// 根据ID获取配置
router.get('/config/:id', async (ctx) => {
  try {
    const id = ctx.params.id;
    const config = await configService.loadConfig();
    
    if (!config.mcpServers || !config.mcpServers[id]) {
      ctx.status = 404;
      ctx.body = { error: `MCP configuration with ID ${id} not found` };
      return;
    }
    
    // 构建单个配置的详细信息
    const serverConfig = config.mcpServers[id];
    const isRunning = await configService.isMCPRunning(id);
    
    ctx.body = {
      ...config,
      id,
      name: serverConfig.name,
      isRunning,
      selectedServer: { [id]: serverConfig }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to get configuration'
    };
  }
});




// 切换MCP状态
router.post('/config/toggle/:id', async (ctx) => {
  try {
    const id = ctx.params.id;
    const newStatus = await configService.toggleMCPStatus(id);
    ctx.body = { id, isRunning: newStatus };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to toggle MCP status'
    };
  }
});

router.post('/config/capabilities/:id', async (ctx) => {
  try {
    const id = ctx.params.id;
    const newStatus = await configService.capabilities(id);
    ctx.body = newStatus;
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      id: ctx.params.id,
      error: error instanceof Error ? error.message : 'Failed to toggle MCP status'
    };
  }
});

// 保存配置
router.post('/config', async (ctx) => {
  try {
    const config: MCPConfig = ctx.request.body as MCPConfig;
    await configService.saveConfig(config);
    ctx.body = { message: 'Configuration saved successfully' };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to save configuration'
    };
  }
});

// 聊天相关路由
router.get('/chat/history', async (ctx) => {
  try {
    const messages = await chatService.getMessages();
    ctx.body = messages;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to get chat history'
    };
  }
});

router.post('/chat/message', async (ctx) => {
  try {
    const message = ctx.request.body;
    const role = message.role || 'default';
    await chatService.addMessage({
      content: message.message,
      role,
      timestamp: Date.now(),
      type: 'text'
    });
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to add message'
    };
  }
});

router.post('/chat/image', upload.single('image'), async (ctx) => {
  try {
    const file = ctx.file;
    if (!file) {
      throw new Error('No image file uploaded');
    }
    
    const imageUrl = `/images/${file.filename}`;
    await chatService.addMessage({
      role: 'user',
      content: '',
      timestamp: Date.now(),
      type: 'image',
      imageUrl
    });
    
    ctx.body = { success: true, imageUrl };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
});

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 静态文件服务
// app.use(require('koa-static')(path.join(process.cwd(), 'data')));

// 启动服务器
console.log('running on import.meta.env.PROD', process.env.PROD);
// if (process.env.PROD) {
  app.listen(3000);
  console.log('running on http://localhost:3000');
// }

export const viteNodeApp = app;
