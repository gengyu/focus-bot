import {Body, Controller, Post, SSE} from '../decorators/decorators';
import {ResultHelper} from './routeHelper';

import {ChatMessage, type Conversation, Model} from "../../../../share/type";
import {ChatService} from "../services/ChatService";
import {ChatHistoryService} from "../services/ChatHistoryService";
import {DialogStateService} from "../services/DialogStateService";

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
	async postMessage(@Body('message') userMessage: ChatMessage, @Body('chatId') chatId: string, @Body('model') model: Model) {
		try {
			return  this.chatService.streamChat(chatId, userMessage, model);
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
