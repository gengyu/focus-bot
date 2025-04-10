import fs from 'fs';
import path from 'path';
import { MCPConfig, ConfigService, ConfigValidationResult, ConfigValidationError, ConfigStorageOptions, MCPConfigListItem } from '../types/config';

export class FileConfigService implements ConfigService {
  private filePath: string;
  private runningMCPs: Set<string> = new Set();

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
          debug: false,
          mcpServers: {}
        };
      }
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConfigList(): Promise<MCPConfigListItem[]> {
    try {
      const config = await this.loadConfig();
      const configList: MCPConfigListItem[] = [];
      
      // 将配置转换为列表项
      Object.entries(config.mcpServers || {}).forEach(([id, serverConfig]) => {
        configList.push({
          id,
          name: serverConfig.name || `MCP配置${id}`,
          isRunning: this.runningMCPs.has(id)
        });
      });
      
      return configList;
    } catch (error) {
      throw new Error(`Failed to get config list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleMCPStatus(id: string): Promise<boolean> {
    try {
      // 检查配置是否存在
      const config = await this.loadConfig();
      if (!config.mcpServers || !config.mcpServers[id]) {
        throw new Error(`MCP configuration with ID ${id} not found`);
      }
      
      // 切换运行状态
      const isCurrentlyRunning = this.runningMCPs.has(id);
      
      if (isCurrentlyRunning) {
        this.runningMCPs.delete(id);
        // 这里可以添加实际停止MCP服务的逻辑
        console.log(`Stopping MCP server: ${id}`);
      } else {
        this.runningMCPs.add(id);
        // 这里可以添加实际启动MCP服务的逻辑
        console.log(`Starting MCP server: ${id}`);
      }
      
      return !isCurrentlyRunning; // 返回新的运行状态
    } catch (error) {
      throw new Error(`Failed to toggle MCP status: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

