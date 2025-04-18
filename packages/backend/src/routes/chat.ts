import { Controller, Get, Post } from '../decorators';
import { ChatMessage, ChatService } from '../services/chatService';
import multer from '@koa/multer';
import path from 'path';
import { z } from 'zod';
import { Context } from 'koa';

const chatService = new ChatService();
chatService.initialize().catch(error => {
  console.error('Failed to initialize chat service:', error);
});

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'data', 'images'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

const messageBodySchema = z.object({
  role: z.string().optional(),
  message: z.string()
});

@Controller('/chat')
export class ChatController {
  @Get('/history')
  async getHistory(ctx: Context) {
    const messages = await chatService.getMessages();
    ctx.body = { code: 0, message: 'success', data: messages };
  }

  @Post('/message')
  async postMessage(ctx: Context) {
    try {
      const body = messageBodySchema.parse(ctx.request.body);
      const role = body.role || 'default';
      const chatMsg: ChatMessage = {
        role: role,
        content: body.message,
        timestamp: Date.now(),
        type: 'text'
      };
      await chatService.addMessage(chatMsg);
      ctx.body = { code: 0, message: 'success', data: chatMsg };
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { code: 1, message: err.message, data: null };
    }
  }

  @Post('/image')
  async uploadImage(ctx: Context, next: Function) {
    await upload.single('image')(ctx, next);
    try {
      const file = ctx.file;
      if (!file) {
        ctx.status = 400;
        ctx.body = { code: 1, message: 'No image file uploaded', data: null };
        return;
      }
      const imageUrl = `/images/${file.filename}`;
      await chatService.addMessage({
        role: 'user',
        content: '',
        timestamp: Date.now(),
        type: 'image',
        imageUrl
      });
      ctx.body = { code: 0, message: 'success', data: { imageUrl } };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = { code: 1, message: error.message || 'Failed to upload image', data: null };
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由