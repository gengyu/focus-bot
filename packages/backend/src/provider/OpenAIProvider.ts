import OpenAI from 'openai';
import axios from "axios";
import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatCompletionMessageParam} from "openai/resources";
import {ProviderConfig} from "../../../../share/type.ts";

// import { Ollama } from "ollama";

// const ollama = new Ollama();

export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {

      temperature: 0.7,
      maxTokens: 2000,
      ...config,
      model: 'deepseek-r1:1.5b',
      apiKey: 'ollama',
      baseURL: 'http://localhost:11434/v1', // Ollama 的本地 API 端点
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL
    });
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: messages as ChatCompletionMessageParam[],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      });

      console.log(response.choices)
      return response.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async *streamChat(messages: Array<{ role: string; content: string }>) {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: messages as ChatCompletionMessageParam[],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });
      for await (const part of stream) {
        console.log(part.choices[0].delta)
        yield {
          content: part.choices[0].delta.content as string,
          reasoningContent: part.choices[0].delta.content as string,
          provider: 'openai',
          model: this.config.model as string,
          role: part.choices[0].delta.role
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
      return [];
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
