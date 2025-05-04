import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatMessage, ProviderConfig} from "../../../../share/type";

import {type Message, Ollama} from "ollama";

export class OllamaAIProvider implements LLMProvider {
  private ollama: Ollama;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;

    this.ollama = new Ollama({
      // apiKey: this.config.apiKey,
      host: this.config.apiUrl
    });
  }

  async chat(messages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    try {
      const msgs: Message[] = messages.map((msg) => {
        return {
          role: msg.role,
          content: msg.content
        }
      })
      // https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=https%3A%2F%2Fhelp.aliyun.com%2Fdocument_detail%2F2712576.html
      const response = await this.ollama.chat({
        model: modelId,
        messages: msgs,
        stream: false,
        options: {
          temperature: this.config.temperature,
          // max_tokens: this.config.maxTokens,
        }
      });

      return response.message.content
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async* streamChat(messages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    // as ChatCompletionMessageParam[]
    const msgs: Message[] = messages.map((msg) => {
      return {
        role: msg.role,
        content: msg.content,
      }
    })
    try {
      console.log('📦 OpenAI Stream:', msgs);
      const stream = await this.ollama.chat({
        model: modelId,
        messages: msgs,
        options: {
          temperature: this.config.temperature,
          // max_tokens: this.config.maxTokens,
        },
        // max_tokens: this.config.maxTokens,
        stream: true,
      });
      // const response = await ollama.chat({ model: 'llama3.1', messages: [message], stream: true })
      // for await (const part of response) {
      // 	process.stdout.write(part.message.content)
      // }
      for await (const part of stream) {
        let content = part.message.content;
        yield {
          id: '',
          content: content,
          provider: this.config.id,
          model: modelId,
          role: part.message.role,
          timestamp: part.created_at ? new Date(part.created_at).getTime() : new Date().getTime(),
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
      console.log('📦 Local model list:');
      return this.ollama.list()
    } catch (error) {
      console.error('Ollama API Error:', error);
      throw new Error('Failed to get models from Ollama');
    }
  }
}

