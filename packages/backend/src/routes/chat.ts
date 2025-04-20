import {Body, Controller, Post, SSE} from '../decorators';
import {ChatMessage, ChatService} from '../services/chatService';
import {LLMService} from '../services/llmService';
import multer from '@koa/multer';
import path from 'path';
import {z} from 'zod';
import {ReadableStream} from "node:stream/web";
import {ResultHelper} from './routeHelper';

const chatService = new ChatService();
const llmService = new LLMService({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo'
});

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
  message: z.string(),
  model: z.string().optional()
});

@Controller('/invoke/chat')
export class ChatController {
  @Post('/getChatHistory')
  async getHistory(@Body('cccc') cc: string) {
    const messages = await chatService.getMessages();
    return ResultHelper.success(messages);
  }

  @SSE('/sendMessage')
  async postMessage(@Body() body: any) {
    try {
      const userMessage: ChatMessage = {
        role: 'user',
        content: body.message,
        timestamp: Date.now(),
        type: 'text'
      };
      await chatService.addMessage(userMessage);

      const messages = await chatService.getMessages();
      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content || ''
      }));

      // 动态选择服务商和模型
      let llm;
      let providerCache: { [key: string]: { apiKey: string; defaultModel: string; } } | null = null;

      async function loadProviderConfig() {
        if (providerCache !== null) return;

        try {
          const fs = await import('fs');
          const rawdata = await fs.promises.readFile('./src/config/providerConfig.json');
          providerCache = JSON.parse(rawdata.toString());
        } catch (err) {
          console.error('Error loading provider config:', err);
          providerCache = {};
        }
      }

      function getProviderConfig(providerId: string): { apiKey: string; defaultModel: string; } | null {
        if (providerCache === null) {
          loadProviderConfig();
        }

        return providerCache ? providerCache[providerId] || null : null;
      }

      if (body.providerId) {
        const providerConfig = getProviderConfig(body.providerId);
        if (!providerConfig) {
          throw new Error(`Provider ${body.providerId} not found`);
        }
        llm = new LLMService({
          apiKey: providerConfig.apiKey,
          model: body.model || providerConfig.defaultModel || 'gpt-3.5-turbo'
        });
      } else {
        llm = llmService;
      }

      const stream = await llm.streamChat(chatMessages);
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            type: 'text'
          };
          await chatService.addMessage(assistantMessage);
          controller.close();
        }
      });

      return readableStream;
    } catch (err: any) {
      console.error('Error in postMessage:', err);
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/image')
  async uploadImage(  body: any) {
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
