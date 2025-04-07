import { MCPTransport, MCPRequest, MCPResponse, MCPStreamOptions } from '../types';
import { Readable } from 'stream';

export class StdioTransport implements MCPTransport {
  private readonly stdin: NodeJS.ReadableStream;
  private readonly stdout: NodeJS.WritableStream;

  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
  }

  async invokeDirect(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve) => {
      // Write request to stdout
      this.stdout.write(JSON.stringify(request) + '\n');

      // Read response from stdin
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          this.stdin.removeListener('data', responseHandler);
          resolve(response);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse response';
          resolve({
            success: false,
            error: errorMessage,
          });
        }
      };

      this.stdin.on('data', responseHandler);
    });
  }

  async invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void> {
    // Write request to stdout
    this.stdout.write(JSON.stringify(request) + '\n');

    // Read stream data from stdin
    const streamHandler = (data: Buffer) => {
      try {
        const chunk = JSON.parse(data.toString());
        if (chunk.type === 'data') {
          options.onData?.(chunk.data);
        } else if (chunk.type === 'error') {
          options.onError?.(new Error(chunk.error));
        } else if (chunk.type === 'end') {
          this.stdin.removeListener('data', streamHandler);
          options.onComplete?.();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to parse stream data';
        options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    };

    this.stdin.on('data', streamHandler);
  }
} 