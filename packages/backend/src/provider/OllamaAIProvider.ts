import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatMessage, ProviderConfig} from "../../../../share/type";
import { v4 as uuidv4 } from 'uuid';
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

  private formatMessage(messages: ChatMessage[]): Message[] {
    return messages.map((chatMessage) => {
      // if(msg.role === 'system')
      if (typeof chatMessage.content === 'string') {
        return {
          role: chatMessage.role,
          content: chatMessage.content
        }
      }

      // msg.role === 'user' #todo 处理大模型返回的images
      // 处理img
      const images = chatMessage.content
        ?.filter(messageContent => messageContent.type === 'image')
        .map(messageContent => messageContent.images)
        .flat().filter(Boolean).map(image => image.url?.split(',')[1]);

      const textContent = chatMessage.content.map(messageContent => {
        if (messageContent.type === 'file') {
          const files = Array.isArray(messageContent.files) ? messageContent.files : [messageContent.files]
          return files.map(messageFile => {
            if (messageFile.content) {
              return (messageFile.metadata.originalname ?? '') + '\n' + messageFile.content;
            }
            return ''
          }).filter(Boolean).join('\n')
        }
        if (messageContent.type === 'text') {
          return messageContent.text
        }
      }).filter(Boolean).join('\n');


      return {
        role: chatMessage.role,
        content: textContent,
        images,
      } as Message
    });
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

  async* streamChat(chatMessages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    const messages: Message[] = this.formatMessage(chatMessages);

    let abortHandler: () => void;
    try {
      console.log('📦 OpenAI Stream:', messages);
      if (signal?.aborted) {
        return;
      }
      const stream = await this.ollama.chat({
        model: modelId,
        messages: messages,
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


      const messageId = uuidv4();


      for await (const part of stream) {
        let content = part.message.content;
        yield {
          id: messageId,
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
      const list = await this.ollama.list()
      console.log('📦 Local model list:', list?.models);
      return list?.models;
    } catch (error) {
      console.error('Ollama API Error:', error);
      throw new Error('Failed to get models from Ollama');
    }
  }
}

