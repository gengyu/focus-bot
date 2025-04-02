import { MCPClientOptions, MCPRequest, MCPResponse, MCPInvocationMode, MCPStreamOptions } from '../types';
import { HTTPTransport } from '../transports/HTTPTransport';
import { StdioTransport } from '../transports/StdioTransport';

export class MCPClient {
  private readonly config: MCPClientOptions['config'];
  private readonly logger: NonNullable<MCPClientOptions['logger']>;
  private readonly transport: HTTPTransport | StdioTransport;

  constructor(options: MCPClientOptions) {
    this.config = options.config;
    this.logger = options.logger || this.defaultLogger;

    // Initialize transport based on config
    this.transport = this.config.transport === 'stdio'
      ? new StdioTransport()
      : new HTTPTransport({
          serverUrl: this.config.serverUrl,
          apiKey: this.config.apiKey,
        });

    if (this.config.debug) {
      this.setupDebugLogging();
    }
  }

  private defaultLogger(message: string, level: 'info' | 'debug' | 'error'): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  private setupDebugLogging(): void {
    this.logger('Debug mode enabled', 'debug');
  }

  public async invokeTool(request: MCPRequest, mode: MCPInvocationMode = 'direct', streamOptions?: MCPStreamOptions): Promise<MCPResponse | void> {
    try {
      this.logger(`Invoking tool: ${request.tool} in ${mode} mode`, 'info');

      if (mode === 'stream') {
        return this.transport.invokeStream(request, streamOptions || {});
      } else {
        return this.transport.invokeDirect(request);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger(`Error invoking tool ${request.tool}: ${errorMessage}`, 'error');
      
      if (mode === 'stream' && streamOptions?.onError) {
        streamOptions.onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
} 