import {Body, Controller, Post, SSE} from '../decorators/decorators';
import {ResultHelper} from './routeHelper';

import {ChatMessage, type Conversation, Model} from "../../../../share/type";
import {ChatService} from "../services/ChatService";
import {ChatHistoryService} from "../services/ChatHistoryService";
import {DialogStateService} from "../services/DialogStateService";
import {ChatOptions} from "../../../../share/chat.ts";

@Controller('/invoke/chat')
export class ChatController {

  private chatService: ChatService;
  private dialogService: DialogStateService;
  private chatHistoryService: ChatHistoryService;

  constructor() {
    this.chatService = new ChatService();
    this.dialogService = new DialogStateService();
    this.chatHistoryService = new ChatHistoryService();
  }


  @Post('/getChatHistory')
  async getHistory(@Body('chatId') chatId: string) {
    const messages = await this.chatHistoryService.getMessages(chatId);
    return ResultHelper.success(messages);
  }

  @SSE('/sendMessage')
  async postMessage(@Body('message') userMessage: ChatMessage,
                    @Body('chatOptions') chatOptions: ChatOptions,
                    @Body('resendId') resendId?: string
  ) {
    try {
      const chatId = chatOptions.dialogId!;
      // todo 重新发送逻辑变更，可以查看多条记录
      await this.chatHistoryService.pushMessage(chatId, userMessage, resendId);
      const historyMessages = await this.chatHistoryService.getMessages(chatId);

      const [abort, readableStream] = await this.chatService.chat(historyMessages, {...chatOptions, stream: true});
      const [stream1, stream2] = readableStream.tee();
      stream2.pipeTo(this.chatHistoryService.getWriteStorageStream(chatId)).catch(error => {
        console.error('Error writing to storage:', error);
      });

      return [abort, stream1];
    } catch (err: any) {
      console.error('Error in postMessage:', err);
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/saveDialogList')
  async saveDialogConfig(@Body() config: Conversation) {
    try {
      await this.dialogService.saveDialogList(config);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/getDialogList')
  async getDialogList() {
    try {
      const data = await this.dialogService.getDialogList();
      return ResultHelper.success(data);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由
