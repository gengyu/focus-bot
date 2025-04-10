export interface MCPServerConfig {
  command: string;
  args: string[];
  name: string;
}

export interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MCPConfigListItem {
  id: string;
  name: string;
  isRunning: boolean;
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

export interface ConfigStorageOptions {
  filePath?: string;
  encryptKey?: string;
}

export interface ConfigService {
  saveConfig(config: MCPConfig): Promise<void>;
  loadConfig(): Promise<MCPConfig>;
  validateConfig(config: MCPConfig): ConfigValidationResult;
  getConfigList(): Promise<MCPConfigListItem[]>;
  toggleMCPStatus(id: string): Promise<boolean>;
  isMCPRunning(id: string): Promise<boolean>;
}