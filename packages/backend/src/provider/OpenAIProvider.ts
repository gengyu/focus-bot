import OpenAI from 'openai';
import axios from "axios";
import {LLMProvider, ProviderResponseChunk} from "./LLMProvider";
import {type ChatCompletionMessageParam} from "openai/resources";
import {type ChatMessage, ProviderConfig} from "../../../../share/type.ts";

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

  async chat(messages:ChatMessage[], modelId: string) {
    try {
      const msgs = messages.map((msg) => {
        return {
          role: msg.role,
          content: msg.content
        }
      })
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: msgs as ChatCompletionMessageParam[],
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

  async *streamChat(messages: ChatMessage[], modelId: string) {
    // as ChatCompletionMessageParam[]
    const msgs: ChatCompletionMessageParam[] = messages.map((msg) => {
      return {
        role: msg.role,
        content: msg.content,
      }
    })
    try {
      const stream = await this.openai.chat.completions.create({
        model: modelId,
        messages: msgs ,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });
      for await (const part of stream) {
        yield {
          content: part.choices[0].delta.content as string,
          reasoningContent: part.choices[0].delta.content as string,
          provider: 'openai',
          model: modelId,
          role: part.choices[0].delta.role,
          timestamp: part.created,
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
