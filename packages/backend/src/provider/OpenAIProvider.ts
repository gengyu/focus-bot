import OpenAI from 'openai';
import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatCompletionMessageParam} from "openai/resources";
import {type ChatMessage, ProviderConfig} from "../../../../share/type";
import type {Message} from "ollama";
import {formatMessage} from './formatMessage';

 

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

	async* streamChat(chatMessages: ChatMessage[], modelId: string, signal?: AbortSignal) {
		// as ChatCompletionMessageParam[]
		const messages: Message[] = formatMessage(chatMessages);
		console.log(messages);
		const msgs  = chatMessages.map((msg) => {
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
			const modelsPage = await this.openai.models.list({stream: false});
		 	return modelsPage.data.map((model) => model.id);
		} catch (error) {
			console.error('Ollama API Error:', error);
			throw new Error('Failed to get models from Ollama');
		}
	}
}


