import {Body, Controller, Get, Post} from '../decorators';
import { ChatMessage, ChatService } from '../services/chatService';
import multer from '@koa/multer';
import path from 'path';
import { z } from 'zod';

import { ResultHelper } from './routeHelper';

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

@Controller('/invoke/chat')
export class ChatController {
  @Post('/getChatHistory')
  async getHistory() {
    const messages = await chatService.getMessages();
    return ResultHelper.success(messages);
  }

  @Post('/message')
  async postMessage(@Body() body: any) {
    try {
      const parsed = messageBodySchema.parse(body);
      const role = parsed.role || 'default';
      const chatMsg: ChatMessage = {
        role: role,
        content: parsed.message,
        timestamp: Date.now(),
        type: 'text'
      };
      await chatService.addMessage(chatMsg);
      return ResultHelper.success(chatMsg);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/image')
  async uploadImage(@Body() body: any) {
    // 注意：图片上传接口如需支持自动注入需配合中间件处理，这里暂保留body参数
    // 实际项目中建议将文件上传逻辑迁移到专用中间件或服务
    // 这里假设body.image为图片文件名
    try {
      const file = body.file;
      if (!file) {
        return ResultHelper.fail('No image file uploaded', null);
      }
      const imageUrl = `/images/${file.filename}`;
      await chatService.addMessage({
        role: 'user',
        content: '',
        timestamp: Date.now(),
        type: 'image',
        imageUrl
      });
      return ResultHelper.success({ imageUrl });
    } catch (error: any) {
      return ResultHelper.fail(error.message || 'Failed to upload image', null);
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由