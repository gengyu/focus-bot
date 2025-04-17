import axios, { AxiosInstance } from 'axios';
import { MCPRequest, MCPResponse, MCPStreamOptions } from '@mcp-connect/core';
import { Transport } from '../types';

/**
 * HTTP传输配置
 */
interface HTTPTransportConfig {
  serverUrl: string;
  apiKey?: string;
}

/**
 * HTTP传输实现
 * 通过HTTP请求与服务端通信
 */
export class HTTPTransport implements Transport {
  private readonly client: AxiosInstance;

  constructor(config: HTTPTransportConfig) {
    this.client = axios.create({
      baseURL: config.serverUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });
  }

  /**
   * 直接调用，返回响应
   */
  async invokeDirect(request: MCPRequest): Promise<MCPResponse> {
    try {
      // 检查payload是否为FormData
      let data = request;
      let headers = {};
      if (request.payload && typeof FormData !== 'undefined' && request.payload instanceof FormData) {
        data = request.payload as any;
        // axios会自动设置multipart边界，无需手动设置Content-Type
        headers = { ...(this.client.defaults.headers || {}), ...this.client.defaults.headers.common };
        // @ts-ignore
        delete headers['Content-Type'] ;
      }
      const response = await this.client.post('/invoke', data, { headers });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 流式调用，通过回调处理响应
   */
  async invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void> {
    try {
      const response = await this.client.post('/invoke/stream', request, {
        responseType: 'stream',
      });

      const stream = response.data;
      
      stream.on('data', (chunk: Buffer) => {
        try {
          const data = JSON.parse(chunk.toString());
          options.onData?.(data);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse stream data';
          options.onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      });

      stream.on('error', (error: Error) => {
        options.onError?.(error);
      });

      stream.on('end', () => {
        options.onComplete?.();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}