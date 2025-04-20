import axios, { type AxiosInstance } from 'axios';


import type { Transport, TransportRequest, TransportResponse, TransportStreamOptions } from "./types.ts";

/**
 * HTTP传输配置
 */
interface HTTPTransportConfig {
  serverUrl: string;
  prefix?: string;
  apiKey?: string;
}

/**
 * HTTP传输实现
 * 通过HTTP请求与服务端通信
 */
export class HTTPTransport implements Transport {
  private readonly client: AxiosInstance;
  private config: HTTPTransportConfig;

  constructor(config: HTTPTransportConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.serverUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && {'Authorization': `Bearer ${ config.apiKey }`}),
      },
    });
  }

  /**
   * 直接调用，返回响应
   */
  async invokeDirect(request: TransportRequest): Promise<TransportResponse> {
    try {
      // 检查payload是否为FormData
      let data = request;
      let headers = {};
      data = request.payload as any;
      if (request.payload && typeof FormData !== 'undefined' && request.payload instanceof FormData) {
        // data = request.payload as any;
        // axios会自动设置multipart边界，无需手动设置Content-Type
        headers = {...(this.client.defaults.headers || {}), ...this.client.defaults.headers.common};
        // @ts-ignore
        delete headers['Content-Type'];
      }
      const method = this.config.prefix ? `${ this.config.prefix }/${ request.method }` : request.method;
      const response = await this.client.post('/invoke/' + method, data, {headers});

      return {
        success: response.data.code === 0,
        data: response.data.data,
      } ;
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
   invokeStream(request: TransportRequest) {
    return new ReadableStream({
      start: async (controller) => {
        try {
          const response = await this.invokeDirect(request);

          // 使用EventSource API处理SSE流
          const eventSource = new EventSource(new URL(response.data.url as string, window.location.origin).href);

          eventSource.onmessage = (event) => {
            controller.enqueue(event.data)
            // const errorMessage = error instanceof Error ? error.message : 'Failed to parse stream data';
            // try {
            //
            //   const data = JSON.parse(event.data);
            //
            //   options.onData?.(data);
            // } catch (error) {
            //   const errorMessage = error instanceof Error ? error.message : 'Failed to parse stream data';
            //   options.onError?.(error instanceof Error ? error : new Error(errorMessage));
            // }
          };

          eventSource.onerror = (error) => {
            eventSource.close();
            controller.error(    error ?? new Error('SSE connection error'));
          };

          eventSource.addEventListener('end', () => {
            eventSource.close();
            controller.close();
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          // options.onError?.(error instanceof Error ? error : new Error(errorMessage));
          controller.error(errorMessage)
        }
      },
    });
  }
}
