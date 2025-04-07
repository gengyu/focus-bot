export interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
}

export interface MCPRequest {
  tool: string;
  payload: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPClientOptions {
  config: MCPConfig;
  logger?: (message: string, level: 'info' | 'debug' | 'error') => void;
}

export type MCPInvocationMode = 'direct' | 'stream';

export interface MCPStreamOptions {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface MCPTransport {
  invokeDirect(request: MCPRequest): Promise<MCPResponse>;
  invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void>;
} 