import axios, { AxiosInstance } from 'axios';
import { MCPTransport, MCPRequest, MCPResponse, MCPStreamOptions } from '../types';

export class HTTPTransport implements MCPTransport {
  private readonly client: AxiosInstance;

  constructor(config: { serverUrl: string; apiKey?: string }) {
    this.client = axios.create({
      baseURL: config.serverUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });
  }

  async invokeDirect(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await this.client.post('/invoke', request);
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