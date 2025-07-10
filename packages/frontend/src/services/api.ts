import type {MCPConfig} from '../types/config';
import {TransportAdapter, TransportType} from "../transports";
import {
	type ChatMessage,
	type ChatOptions,
	type Conversation,
	type DialogId,
	type Model,
	type ProviderId
} from "../../../../share/type.ts";
import type {AppSettings} from "../../../../share/appSettings.ts";
import type {KnowledgeDocument} from "../../../../share/knowledge.ts";

export const API_BASE_URL = 'http://localhost:3001';


export interface Capability {
	name: string;
	description: string;
}

export interface ConfigListItem {
	id: string;
	name: string;
	isRunning: boolean;
}


const transport = new TransportAdapter(TransportType.HTTP, {
	prefix: '',
	serverUrl: API_BASE_URL
});


export const callAPI = async <T>(req: { method: string; payload: any }): Promise<T> => {
	const res = await transport.invokeDirect(req);
	if (!res.success) throw new Error(`请求失败: ${res.error}`);
	return res.data;
}

export const callStreamAPI = (req: {
	method: string;
	payload: any
}): [abort: (reason?: any) => void, ReadableStream<ChatMessage>] => {
	const controller = new AbortController();
	return [
		(reason?: any) => controller.abort(reason),
		transport.invokeStream(req, controller.signal)
	];
}


// 获取应用配置
export const getAppSetting = async (): Promise<AppSettings> => callAPI<AppSettings>({
	method: '/config/getAppSetting',
	payload: {}
});

// 保存应用配置
export const saveAppSetting = async (config: AppSettings): Promise<void> => callAPI<void>({
	method: '/config/saveAppSetting',
	payload: config
});

// 获取模型配置
export const getModels = async (providerId: ProviderId): Promise<Model[]> => callAPI<Model[]>({
	method: '/config/getModels',
	payload: {providerId}
});

// 保存对话列表
export const saveDialogList = async (dialog: Conversation) => callAPI({method: '/chat/saveDialogList', payload: dialog})

// 获取对话列表
export const getDialogList = async () => callAPI<Conversation>({method: '/chat/getDialogList', payload: {}})

// 获取聊天记录
export const getChatHistory = async (chatId: DialogId): Promise<ChatMessage[]> => callAPI<ChatMessage[]>({
	method: '/chat/getChatHistory',
	payload: {chatId}
})
// 发送聊天消息
export const sendChatMessage = (message: ChatMessage, chatOptions: ChatOptions, resendId?: string) => {
	return callStreamAPI({method: '/chat/sendMessage', payload: {message, chatOptions, resendId}})
}


// 上传文档
export const fileParserUpload =(files: File[])=> {
	const formData = new FormData();
	files.forEach(file => {
		formData.append('files', file);
	});
	return callAPI<KnowledgeDocument[]>({ method: '/fileParser/upload/documents', payload: formData })
}





export class ConfigAPI {
	private async callAPI<T>(req: { method: string; payload: any }): Promise<T> {
		const res = await transport.invokeDirect(req);
		if (!res.success) throw new Error(`请求失败: ${res.error}`);
		return res.data;
	}

	async getModelConfig(): Promise<AppSettings> {
		return this.callAPI({method: 'getAppSetting', payload: {}});
	}

	async getModels(providerId: ProviderId): Promise<AppSettings> {
		return this.callAPI({method: 'getModels', payload: {providerId}});
	}

	async saveAppSetting(config: AppSettings): Promise<void> {
		return this.callAPI({method: 'saveAppSetting', payload: config});
	}

	async getConfigList(): Promise<ConfigListItem[]> {
		return this.callAPI({method: 'list', payload: {}});
	}

	async getConfigById(id: string): Promise<MCPConfig> {
		return this.callAPI({method: 'getConfigById', payload: {id}});
	}

	async toggleMCPStatus(id: string): Promise<boolean> {
		return this.callAPI({method: 'toggleMCPStatus', payload: {id}});
	}

	async capabilities(id: string): Promise<Capability[]> {
		return this.callAPI({method: 'capabilities', payload: {id}});
	}

	async saveConfig(config: MCPConfig): Promise<void> {
		return this.callAPI({method: 'saveConfig', payload: {config}});
	}

	async loadConfig(): Promise<MCPConfig> {
		return this.callAPI({method: 'loadConfig', payload: {}});
	}
}

export const configAPI = new ConfigAPI();