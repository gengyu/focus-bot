import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatMessage, MessageFile, ProviderConfig} from "../../../../share/type";

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

  private formatMessage(messages: ChatMessage[]){
    return messages.map((msg) => {
      if(msg.role === 'user'){
        // 处理imgs
        const images = msg.images?.map((img) => {
          if(img instanceof Uint8Array || typeof img === 'string'){
            return ''
          }
          return (img as MessageFile).url?.split(',')[1];
        }).filter(Boolean)

        return {
          role: msg.role,
          content: msg.content,
          images,
        } as Message
      }

      return {role: msg.role, content: msg.content};

    })
  }

  async chat(messages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    try {
      const msgs: Message[] = messages.map((msg) => {
        return {
          role: msg.role as string,
          content: msg.content as string
        }
      })
      // signal?.addEventListener('abort', () => {
      //   this.ollama.abort();
      // });
      if (signal?.aborted) {
        return;
      }
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
    const mags: Message[] = this.formatMessage(messages);

    let abortHandler: ()=>void;
    try {
      console.log('📦 OpenAI Stream:', mags);
      if (signal?.aborted) {
        return;
      }
      const stream = await this.ollama.chat({
        model: modelId,
        messages: mags,
        options: {
          temperature: this.config.temperature,
          // max_tokens: this.config.maxTokens,
        },
        // max_tokens: this.config.maxTokens,
        stream: true,
      });
      abortHandler = () => {
        stream?.abort();
      }
      signal?.addEventListener('abort', abortHandler);
      if (signal?.aborted) {
        return;
      }

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
    } finally {
      // @ts-ignore
      abortHandler && signal?.removeEventListener('abort', abortHandler);
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

