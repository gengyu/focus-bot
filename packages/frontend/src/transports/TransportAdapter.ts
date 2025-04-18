// import { MCPRequest, MCPResponse, MCPStreamOptions } from '@mcp-connect/core/src/types';

import {HTTPTransport} from './HTTPTransport';
import {EventTransport} from './EventTransport';
import {
  type Transport,
  type TransportConfig,
  type TransportRequest,
  type TransportResponse, type TransportStreamOptions,
  TransportType
} from "./types.ts";

/**
 * 传输适配器类
 * 提供统一的接口来使用不同的传输方式
 */
export class TransportAdapter implements Transport {
  private transport: Transport;
  private config: TransportConfig;

  /**
   * 创建传输适配器
   * @param type 传输类型
   * @param config 传输配置
   */
  constructor(type: TransportType, config: TransportConfig) {
    this.config = config;

    // 根据类型创建对应的传输实例
    switch (type) {
      case TransportType.HTTP:
        if (!this.config.serverUrl) {
          throw new Error('HTTP transport requires serverUrl');
        }
        this.transport = new HTTPTransport({
          serverUrl: this.config.serverUrl,
          apiKey: this.config.apiKey,
          prefix: this.config.prefix
        });
        break;


      case TransportType.EVENT:
        this.transport = new EventTransport({
          namespace: this.config.eventNamespace,
          emitter: this.config.eventEmitter
        });
        break;

      default:
        throw new Error(`Unsupported transport type: ${type}`);
    }
  }

  /**
   * 直接调用，返回响应
   */
  async invokeDirect(request: TransportRequest): Promise<TransportResponse> {
    // 自动识别FormData并转发给HTTPTransport
    if (
      this.transport instanceof HTTPTransport &&
      request.payload && typeof FormData !== 'undefined' && request.payload instanceof FormData
    ) {
      // @ts-ignore
      return (this.transport as HTTPTransport).invokeDirect({...request, payload: request.payload});
    }
    return this.transport.invokeDirect(request);
  }

  /**
   * 流式调用，通过回调处理响应
   */
  async invokeStream(request: TransportRequest, options: TransportStreamOptions)  {
      this.transport.invokeStream(request, options);
  }
}