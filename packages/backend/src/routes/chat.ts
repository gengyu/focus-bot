import Router from 'koa-router';
import { ChatMessage, ChatService } from '../services/chatService';
import multer from '@koa/multer';
import path from 'path';
import { z } from 'zod';
import { bindAndHandle } from './routeHelper';

const chatService = new ChatService();
const router = new Router();

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

router.get('/chat/history', bindAndHandle({
  handler: async () => {
    return await chatService.getMessages();
  }
}));

router.post('/chat/message', bindAndHandle({
  bodySchema: messageBodySchema,
  handler: async ({ body }) => {
    const role = body.role || 'default';
    const chatMsg: ChatMessage = {
      role: role,
      content: body.message,
      timestamp: Date.now(),
      type: 'text'
    };
    await chatService.addMessage(chatMsg);
    return chatMsg;
  }
}));

router.post('/chat/image', upload.single('image'), async (ctx, next) => {
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
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 1, message: error instanceof Error ? error.message : 'Failed to upload image', data: null };
  }
  await next();
});

export default router;