import {defineStore} from 'pinia';
import {ref, type Ref} from "vue";
import type {ChatMessage, Dialog, Conversation, Model} from "../../../../share/type.ts";
import { ContextManager, MessageHandler} from "./conversationManager";
import {chatAPI} from "../services/chatApi.ts";

// 创建单例实例
const contextManager = new ContextManager();

const messageHandler = new MessageHandler(contextManager);
/**
 * 会话存储
 * 负责会话数据的状态管理和持久化
 */
export const useDialogStore = defineStore<string, {
	dialogState: Ref<Conversation>,
	updateModel: (model: Model) => Promise<void>,
	setActiveDialog: (id: string) => Promise<void>,
	createConversation: (title: string, model?: Model) => Promise<Dialog>,
	sendMessage: (content: string, model: Model, conversationId: string) => ReadableStream<ChatMessage>,
	sendImage: (imageFile: File) => Promise<ChatMessage>,
	getChatHistory: (conversationId: string) => Promise<ChatMessage[]>
}>('dialog', () => {
	const conversation = ref<Conversation>({
		dialogs: [],
		activeDialogId: '',
	});

	/**
	 * 更新模型
	 * @param model 模型信息
	 */
	const updateModel = async (model: Model) => {
		if (!conversation.value.activeDialogId) return;
		const dialog = conversation.value.dialogs.find(dialog => dialog.id === conversation.value.activeConversationId);
		if (!dialog) return;
		dialog.model = model;
		// 保存到存储
		await chatAPI.saveDialogList(conversation.value);
	}


	/**
	 * 设置活动对话
	 * @param dailogId 对话ID
	 */
	const setActiveDialog = async (dailogId: string) => {
		 conversation.value.activeDialogId = dailogId;
		await chatAPI.saveDialogList(conversation.value);
	}

	/**
	 * 创建新对话
	 * @param title 对话标题
	 * @param model 模型信息
	 * @returns 新对话对象
	 */
	const createConversation = async (title: string, model?: Model) => {
		// return await conversationStore.createConversation(title, model);
	}

	/**
	 * 发送消息
	 * @param content 消息内容
	 * @param model 模型信息
	 * @param conversationId 对话ID
	 * @returns 消息流
	 */
	const sendMessage = (content: string, model: Model, conversationId: string) => {
		return messageHandler.sendMessage(conversationId, content, model);
	}

	/**
	 * 发送图片
	 * @param imageFile 图片文件
	 * @returns 消息对象
	 */
	const sendImage = async (imageFile: File) => {
		return await messageHandler.sendImage(imageFile);
	}

	/**
	 * 获取聊天历史
	 * @param conversationId 对话ID
	 * @returns 消息数组
	 */
	const getChatHistory = async (conversationId: string) => {
		return await messageHandler.getChatHistory(conversationId);
	}

	return {
		dialogState: conversation,
		updateModel,
		setActiveDialog,
		createConversation,
		sendMessage,
		sendImage,
		getChatHistory
	}
});