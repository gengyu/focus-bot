import fs from 'fs';
import path from 'path';
import { MCPConfig, ConfigService, ConfigValidationResult, ConfigValidationError, ConfigStorageOptions } from '../types/config';

export class FileConfigService implements ConfigService {
  private filePath: string;

  constructor(options?: ConfigStorageOptions) {
    this.filePath = options?.filePath || path.join(process.cwd(), 'config.json');
  }

  async saveConfig(config: MCPConfig): Promise<void> {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new ConfigValidationError('Invalid configuration', validation.errors || []);
    }

    try {
      await fs.promises.writeFile(
        this.filePath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadConfig(): Promise<MCPConfig> {
    try {
      const data = await fs.promises.readFile(this.filePath, 'utf-8');
      const config = JSON.parse(data) as MCPConfig;
      const validation = this.validateConfig(config);
      
      if (!validation.isValid) {
        throw new ConfigValidationError('Invalid configuration', validation.errors || []);
      }

      return config;
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 如果配置文件不存在，返回默认配置
        return {
          serverUrl: 'http://localhost:5000',
          transport: 'http',
          debug: false
        };
      }
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateConfig(config: MCPConfig): ConfigValidationResult {
    const errors: string[] = [];

    if (!config.serverUrl) {
      errors.push('Server URL is required');
    } else if (!this.isValidUrl(config.serverUrl)) {
      errors.push('Invalid server URL format');
    }

    if (config.transport && !['stdio', 'http'].includes(config.transport)) {
      errors.push('Transport must be either "stdio" or "http"');
    }

    if (config.debug !== undefined && typeof config.debug !== 'boolean') {
      errors.push('Debug must be a boolean value');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

