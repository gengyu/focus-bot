import { MCPRequest, MCPResponse, MCPStreamOptions } from '@mcp-connect/core/src/types';
import { EventEmitter } from 'eventemitter3';

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
  invokeDirect(request: MCPRequest): Promise<MCPResponse>;
  
  /**
   * 流式调用，通过回调处理响应
   */
  invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void>;
}

/**
 * 事件传输事件类型
 */
export interface EventTransportEvents {
  request: (request: MCPRequest) => void;
  response: (response: MCPResponse) => void;
  streamData: (data: any) => void;
  streamError: (error: Error) => void;
  streamComplete: () => void;
}