import {Body, Controller, Post, SSE} from '../decorators';
import { ChatService} from '../services/chatService';
import {LLMService} from '../services/LLMService';
import multer from '@koa/multer';
import path from 'path';
import {z} from 'zod';
import {ReadableStream} from "node:stream/web";
import {ResultHelper} from './routeHelper';
import {DialogService} from "../services/dailogService.ts";
import {ChatMessage, type DialogState} from "../../../../share/type.ts";

const chatService = new ChatService();
const llmService = new LLMService({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo'
});

const dialogService = new DialogService();



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
  async getHistory(@Body('chatId') chatId: string) {
    const messages = await chatService.getMessages(chatId);
    return ResultHelper.success(messages);
  }

  @SSE('/sendMessage')
  async postMessage(@Body('message') message: string, @Body('chatId') chatId: string, @Body('model') model: string) {
    try {


      const userMessage: ChatMessage = {
        // chatId,
        role: 'user',
        content: message,
        timestamp: Date.now(),
        type: 'text'
      }
      await chatService.pushMessage(chatId, userMessage);

      // 动态选择服务商和模型

      const llm = new LLMService({
        baseURL: 'http://localhost:11434',
        apiKey: apiKey,
        model: model
      });


      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        type: 'text'
      };

      const stream = await llm.streamChat([userMessage]);
      const readableStream = new ReadableStream<string>({
        async start(controller) {
          controller.enqueue(JSON.stringify(assistantMessage));
        },
        async pull(controller) {
          for await (const chunk of stream) {
            const content = chunk.content || '';
            if (content) {
              controller.enqueue(content);
            }
          }
          controller.close();
        }
      });
      const [stream1, stream2] = readableStream.tee();
      stream2.pipeTo(chatService.getWriteStorageStream(chatId)).catch(error => {
        console.error('Error writing to storage:', error);
      });
      return stream1;
    } catch (err: any) {
      console.error('Error in postMessage:', err);
      return ResultHelper.fail(err.message, null);
    }
  }

  // @Post('/image')
  // async uploadImage(  body: any) {
  //   // 注意：图片上传接口如需支持自动注入需配合中间件处理，这里暂保留body参数
  //   // 实际项目中建议将文件上传逻辑迁移到专用中间件或服务
  //   // 这里假设body.image为图片文件名
  //   try {
  //     const file = body.file;
  //     if (!file) {
  //       return ResultHelper.fail('No image file uploaded', null);
  //     }
  //     const imageUrl = `/images/${file.filename}`;
  //     await chatService.pushMessage({
  //       role: 'user',
  //       content: '',
  //       timestamp: Date.now(),
  //       type: 'image',
  //       imageUrl
  //     });
  //     return ResultHelper.success({ imageUrl });
  //   } catch (error: any) {
  //     return ResultHelper.fail(error.message || 'Failed to upload image', null);
  //   }
  // }

  @Post('/saveDialogList')
  async saveDialogConfig(@Body() config: DialogState) {
    try {
      await dialogService.saveDialogList(config);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/getDialogList')
  async getDialogList() {
    try {
      const data = await dialogService.getDialogList();
      return ResultHelper.success(data);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由
