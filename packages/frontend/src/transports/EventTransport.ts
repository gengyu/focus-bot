import { EventEmitter } from 'eventemitter3';
import { MCPRequest, MCPResponse, MCPStreamOptions } from '@mcp-connect/core/src/types';
import { Transport, EventTransportEvents } from '../types';

/**
 * 事件传输配置
 */
interface EventTransportConfig {
  namespace?: string;
  emitter?: EventEmitter;
}

/**
 * 事件传输实现
 * 通过事件发送和监听实现数据传输
 */
export class EventTransport implements Transport {
  private readonly namespace: string;
  private readonly emitter: EventEmitter;

  constructor(config: EventTransportConfig) {
    this.namespace = config.namespace || 'mcp';
    this.emitter = config.emitter || new EventEmitter();
  }

  /**
   * 获取事件名称
   */
  private getEventName(event: string): string {
    return `${this.namespace}:${event}`;
  }

  /**
   * 获取事件发射器
   */
  public getEmitter(): EventEmitter {
    return this.emitter;
  }

  /**
   * 添加事件监听器
   */
  public on<K extends keyof EventTransportEvents>(
    event: K,
    listener: EventTransportEvents[K]
  ): void {
    this.emitter.on(this.getEventName(event as string), listener);
  }

  /**
   * 移除事件监听器
   */
  public off<K extends keyof EventTransportEvents>(
    event: K,
    listener: EventTransportEvents[K]
  ): void {
    this.emitter.off(this.getEventName(event as string), listener);
  }

  /**
   * 直接调用，返回响应
   */
  async invokeDirect(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve) => {
      // 创建一次性响应监听器
      const responseListener = (response: MCPResponse) => {
        this.emitter.off(this.getEventName('response'), responseListener);
        resolve(response);
      };

      // 添加响应监听器
      this.emitter.once(this.getEventName('response'), responseListener);

      // 发送请求事件
      this.emitter.emit(this.getEventName('request'), request);

      // 设置超时处理
      setTimeout(() => {
        if (this.emitter.listenerCount(this.getEventName('response')) > 0) {
          this.emitter.off(this.getEventName('response'), responseListener);
          resolve({
            success: false,
            error: 'Request timeout'
          });
        }
      }, 30000); // 30秒超时
    });
  }

  /**
   * 流式调用，通过回调处理响应
   */
  async invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void> {
    // 创建数据监听器
    const dataListener = (data: any) => {
      options.onData?.(data);
    };

    // 创建错误监听器
    const errorListener = (error: Error) => {
      options.onError?.(error);
    };

    // 创建完成监听器
    const completeListener = () => {
      // 移除所有监听器
      this.emitter.off(this.getEventName('streamData'), dataListener);
      this.emitter.off(this.getEventName('streamError'), errorListener);
      this.emitter.off(this.getEventName('streamComplete'), completeListener);
      
      options.onComplete?.();
    };

    // 添加监听器
    this.emitter.on(this.getEventName('streamData'), dataListener);
    this.emitter.on(this.getEventName('streamError'), errorListener);
    this.emitter.on(this.getEventName('streamComplete'), completeListener);

    // 发送请求事件
    this.emitter.emit(this.getEventName('request'), request);
  }
}