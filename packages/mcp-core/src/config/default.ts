import { MCPConfig } from '../types';

export const defaultConfig: MCPConfig = {
  serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:5000',
  apiKey: process.env.MCP_API_KEY,
  debug: process.env.MCP_DEBUG === 'true',
}; 