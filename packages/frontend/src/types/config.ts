export interface MCPServerConfig {
  command: string;
  args: string[];
  name: string;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors?: string[];
}

export class ConfigValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

 