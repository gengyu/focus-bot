import OpenAI from 'openai';
import axios from "axios";
import {LLMProvider, ProviderConfig} from "./LLMProvider.ts";


class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
      apiKey:'ollama',
      baseURL: "http://localhost:11434/'"
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL
    });
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    try {
      // @ts-ignore
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        // @ts-ignore
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      return response.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async streamChat(messages: Array<{ role: string; content: string }>) {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.config.model!,
        // @ts-ignore
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });

      return stream;
    } catch (error) {
      console.error('OpenAI API Stream Error:', error);
      throw new Error('Failed to create stream from OpenAI');
    }
  }

  //  查询模型列表
  async getModels() {
    try {
      const { data } = await axios.get('http://localhost:11434/api/tags');
      console.log('📦 本地模型列表：');
      data.models.forEach((model: any) => {
        console.log(`- ${model.name}`);
      });
      return data;
      // const response = await this.openai.models.list();
      // return response.data;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get models from OpenAI');
    }
  }
}

export class LLMService {
  private provider: LLMProvider;

  constructor(config: ProviderConfig) {
    // 根据配置选择不同的provider
    // 目前只实现了OpenAI，后续可以扩展其他模型
    this.provider = new OpenAIProvider(config);
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    return this.provider.chat(messages);
  }

  async streamChat(messages: Array<{ role: string; content: string }>) {
    return this.provider.streamChat(messages);
  }

  async getModels() {
    return this.provider.getModels();
  }
}