import OpenAI from 'openai';
import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatCompletionMessageParam} from "openai/resources";
import {type ChatMessage, ProviderConfig} from "../../../../share/type";

// import { Ollama } from "ollama";

// const ollama = new Ollama();

export class OpenAIProvider implements LLMProvider {
	private openai: OpenAI;
	private config: ProviderConfig;

	constructor(config: ProviderConfig) {
		this.config = config;

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
			baseURL: this.config.apiUrl
		});
	}

	formatMessage(messages: ChatMessage[]): Array<ChatCompletionMessageParam> {
		return messages.map((message) => {
			// 处理包含图片的消息
			if (message.images && message.images.length > 0) {
				const content: any[] = [];
				
				// 如果有文本内容，添加文本部分
				if (typeof message.content === 'string') {
					content.push({
						type: 'text',
						text: message.content
					});
				}
				
				// 添加所有图片
				message.images.forEach(image => {
					let imageUrl = '';
					if (typeof image === 'string') {
						imageUrl = image;
					} else if (image instanceof Uint8Array) {
						// 处理二进制图片数据 - 这里可能需要转换为 base64 或其他格式
						// 这部分需要根据实际需求实现
					} else if ('url' in image) {
						imageUrl = image.url || '';
					} else if ('path' in image) {
						imageUrl = image.path || '';
					}
					
					if (imageUrl) {
						content.push({
							type: 'image_url',
							image_url: {
								url: imageUrl
							}
						});
					}
				});
				
				return {
					role: message.role,
					content: content
				};
			}
			
			// 处理包含文件的消息
			if (message.files) {
				// 这里可以根据需要处理文件
				// 目前 OpenAI API 可能不直接支持文件附件，可能需要特殊处理
				// 例如将文件内容作为文本添加，或者上传文件后获取 URL
			}
			
			// 默认处理纯文本消息
			return {
				role: message.role,
				content: message.content
			};
		});
	}

	async chat(messages: ChatMessage[], modelId: string, signal?: AbortSignal) {
		try {
			const msgs = messages.map((msg) => {
				return {
					role: msg.role,
					content: msg.content
				}
			}) as  ChatCompletionMessageParam[]
			// https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=https%3A%2F%2Fhelp.aliyun.com%2Fdocument_detail%2F2712576.html
			const response = await this.openai.chat.completions.create({
				model: modelId,
				messages: msgs,
				temperature: this.config.temperature,
				max_completion_tokens: this.config.maxTokens,
				stream: false,
			}, {
				signal
			});

			return response.choices[0].message;
		} catch (error) {
			console.error('OpenAI API Error:', error);
			throw new Error('Failed to get response from OpenAI');
		}
	}

	async* streamChat(messages: ChatMessage[], modelId: string, signal?: AbortSignal) {
		// as ChatCompletionMessageParam[]
		const msgs  = messages.map((msg) => {
			return {
				role: msg.role,
				content: msg.content,
			}
		}) as ChatCompletionMessageParam[];
		try {
			console.log('📦 OpenAI Stream:', msgs);
			const stream = await this.openai.chat.completions.create({
				model: modelId,
				messages: msgs,
				temperature: this.config.temperature,
				max_tokens: this.config.maxTokens,
				stream: true,
			}, {
				signal
			});
			for await (const part of stream) {
				let content = part.choices[0]?.delta?.content;
				yield {
					id: part.id,
					content: content,
					provider: 'openai',
					model: modelId,
					role: part.choices[0].delta.role,
					timestamp: part.created,
					type: 'text'
				} as ProviderResponseChunk;
			}
		} catch (error) {
			console.error('OpenAI API Stream Error:', error);
			throw new Error('Failed to create stream from OpenAI');
		}
	}

	async getModels() {
		try {
			// const tags = await ollama.tags();
			console.log('📦 Local model list:');
			// return [];
			return this.openai.models.list()
		} catch (error) {
			console.error('Ollama API Error:', error);
			throw new Error('Failed to get models from Ollama');
		}
	}
}


// async function test(){
//   try {
//
//     const open = new OpenAIProvider({} as ProviderConfig);
//     const res = await open.chat([{role: 'user', content: 'hello'}])
//     console.log(res, 333);
//   }catch (e) {
//     console.log(e);
//   }
//
// }
//
// test();
