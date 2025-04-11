import { MCPClient } from '../core/MCPClient';
import { MCPConfig, MCPStreamOptions, MCPResponse } from '../types';
import { HTTPTransport } from '../transports/HTTPTransport';
import { StdioTransport } from '../transports/StdioTransport';
import axios from 'axios';
import { EventEmitter } from 'events';

jest.mock('axios');
jest.mock('../transports/HTTPTransport');
jest.mock('../transports/StdioTransport');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHTTPTransport = HTTPTransport as jest.MockedClass<typeof HTTPTransport>;
const mockedStdioTransport = StdioTransport as jest.MockedClass<typeof StdioTransport>;

describe('MCPClient', () => {
  let client: MCPClient;
  const mockConfig: MCPConfig = {
    serverUrl: 'http://test-server',
    apiKey: 'test-api-key',
    debug: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Transport', () => {
    beforeEach(() => {
      client = new MCPClient({
        config: { ...mockConfig, transport: 'http' },
      });
    });

    it('should be defined', () => {
      expect(client).toBeDefined();
    });

    it('should invoke tool successfully in direct mode', async () => {
      const mockResponse = { success: true, data: { result: 'success' } };
      mockedHTTPTransport.prototype.invokeDirect.mockResolvedValueOnce(mockResponse);

      const result = await client.invokeTool({
        tool: 'test-tool',
        payload: { test: 'data' },
      }, 'direct') as MCPResponse;

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle errors when invoking tool in direct mode', async () => {
      mockedHTTPTransport.prototype.invokeDirect.mockResolvedValueOnce({
        success: false,
        error: 'Test error',
      });

      const result = await client.invokeTool({
        tool: 'test-tool',
        payload: { test: 'data' },
      }, 'direct') as MCPResponse;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('should handle stream mode invocation', async () => {
      const streamOptions: MCPStreamOptions = {
        onData: jest.fn(),
        onError: jest.fn(),
        onComplete: jest.fn(),
      };

      // Mock the stream implementation
      const mockStream = new EventEmitter();
      mockedHTTPTransport.prototype.invokeStream.mockImplementationOnce(async (request, options) => {
        // Simulate stream events
        options.onData?.({ chunk: 1 });
        options.onData?.({ chunk: 2 });
        options.onComplete?.();
      });

      await client.invokeTool(
        {
          tool: 'test-tool',
          payload: { test: 'data' },
        },
        'stream',
        streamOptions
      );

      expect(streamOptions.onData).toHaveBeenCalledTimes(2);
      expect(streamOptions.onData).toHaveBeenNthCalledWith(1, { chunk: 1 });
      expect(streamOptions.onData).toHaveBeenNthCalledWith(2, { chunk: 2 });
      expect(streamOptions.onComplete).toHaveBeenCalledTimes(1);
      expect(streamOptions.onError).not.toHaveBeenCalled();
    });
  });

  describe('Stdio Transport', () => {
    beforeEach(() => {
      client = new MCPClient({
        config: { ...mockConfig, transport: 'stdio' },
      });
    });

    it('should be defined', () => {
      expect(client).toBeDefined();
    });

    it('should invoke tool successfully in direct mode', async () => {
      const mockResponse = { success: true, data: { result: 'success' } };
      mockedStdioTransport.prototype.invokeDirect.mockResolvedValueOnce(mockResponse);

      const result = await client.invokeTool({
        tool: 'test-tool',
        payload: { test: 'data' },
      }, 'direct') as MCPResponse;

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle errors when invoking tool in direct mode', async () => {
      mockedStdioTransport.prototype.invokeDirect.mockResolvedValueOnce({
        success: false,
        error: 'Test error',
      });

      const result = await client.invokeTool({
        tool: 'test-tool',
        payload: { test: 'data' },
      }, 'direct') as MCPResponse;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('should handle stream mode invocation', async () => {
      const streamOptions: MCPStreamOptions = {
        onData: jest.fn(),
        onError: jest.fn(),
        onComplete: jest.fn(),
      };

      // Mock the stream implementation
      mockedStdioTransport.prototype.invokeStream.mockImplementationOnce(async (request, options) => {
        // Simulate stream events
        options.onData?.({ chunk: 1 });
        options.onData?.({ chunk: 2 });
        options.onComplete?.();
      });

      await client.invokeTool(
        {
          tool: 'test-tool',
          payload: { test: 'data' },
        },
        'stream',
        streamOptions
      );

      expect(streamOptions.onData).toHaveBeenCalledTimes(2);
      expect(streamOptions.onData).toHaveBeenNthCalledWith(1, { chunk: 1 });
      expect(streamOptions.onData).toHaveBeenNthCalledWith(2, { chunk: 2 });
      expect(streamOptions.onComplete).toHaveBeenCalledTimes(1);
      expect(streamOptions.onError).not.toHaveBeenCalled();
    });
  });
}); 