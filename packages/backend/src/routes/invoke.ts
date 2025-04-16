import Router from 'koa-router';
import { Context } from 'koa';
import { bindAndHandle } from './routeHelper';

const router = new Router();

// 路由注册表，可根据需要扩展
const methodMap: Record<string, (ctx: Context) => Promise<any> | any> = {
  'chat/history': async (ctx) => {
    // 动态引入 chatService
    const { ChatService } = await import('../services/chatService');
    const chatService = new ChatService();
    await chatService.initialize();
    return chatService.getMessages();
  },
  'chat/message': async (ctx) => {
    const { ChatService } = await import('../services/chatService');
    const chatService = new ChatService();
    await chatService.initialize();
    const { role = 'default', message } = ctx.request.body;
    const chatMsg = {
      role,
      content: message,
      timestamp: Date.now(),
      type: 'text'
    };
    await chatService.addMessage(chatMsg);
    return chatMsg;
  },
  'config': async (ctx) => {
    const { FileConfigService } = await import('../services/configService');
    const configService = new FileConfigService();
    return configService.loadConfig();
  },
  // 可继续添加其他方法
};

router.all('/invoke/(.*)', bindAndHandle({
  handler: async ({ ctx }) => {
    const subPath = ctx.params[0];
    const method = methodMap[subPath];
    if (!method) {
      ctx.status = 404;
      return { message: `未找到方法: ${subPath}` };
    }
    return await method(ctx);
  }
}));

export default router;