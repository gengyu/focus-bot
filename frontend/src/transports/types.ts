
import { EventEmitter } from 'eventemitter3';



export interface TransportAdapterOptions {
  /**
   * 传输类型
   */
  type: TransportType;
  /**
   * 传输配置
   */
  config: TransportConfig;
}
export interface TransportRequest {
  method: string
  payload: any;
}

export interface TransportResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TransportStreamOptions {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * 支持的传输类型
 */
export enum TransportType {
  HTTP = 'http',
  COMMAND = 'command',
  EVENT = 'event'
}

/**
 * 传输配置接口
 */
export interface TransportConfig {
  // HTTP传输配置
  serverUrl?: string;
  apiKey?: string;
  prefix?: string;
  
  // 命令行传输配置
  commandPath?: string;
  commandArgs?: string[];
  
  // 事件传输配置
  eventNamespace?: string;
  eventEmitter?: EventEmitter;
  
  // 通用配置
  debug?: boolean;
}

/**
 * 传输接口
 */
export interface Transport {
  /**
   * 直接调用，返回响应
   */
  invokeDirect(request: TransportRequest): Promise<TransportResponse>;

  /**
   * 流式调用，通过回调处理响应
   */
  invokeStream(request: TransportRequest): ReadableStream;
}

/**
 * 事件传输事件类型
 */
export interface EventTransportEvents {
  request: (request: TransportRequest) => void;
  response: (response: TransportResponse) => void;
  streamData: (data: any) => void;
  streamError: (error: Error) => void;
  streamComplete: () => void;
}