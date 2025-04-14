import fs from 'fs';
import path from 'path';
import { MCPConfig } from '../types/config';

export interface PersistenceOptions {
  dataDir?: string;
  configFileName?: string;
}

import { EventEmitter } from 'events';

export class PersistenceService extends EventEmitter {
  static readonly EVENT_MCP_AUTO_START = 'mcpAutoStart';
  private dataDir: string;
  private configFilePath: string;

  constructor(options?: PersistenceOptions) {
    super();
    this.dataDir = options?.dataDir || path.join(process.cwd(), 'data');
    this.configFilePath = path.join(this.dataDir, options?.configFileName || 'config.json');
  }

  async initialize(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.promises.mkdir(this.dataDir, { recursive: true });
      
      // 如果配置文件不存在，创建默认配置
      if (!await this.exists(this.configFilePath)) {
        const defaultConfig: MCPConfig = {
          serverUrl: 'http://localhost:5000',
          transport: 'http',
          debug: false,
          mcpServers: {}
        };
        await this.saveData(defaultConfig);
      } else {
        // 加载现有配置并检查运行状态
        const config = await this.loadData();
        Object.entries(config.mcpServers).forEach(([id, server]) => {
          if (server.isRunning) {
            // 通知ConfigService启动该MCP
            this.emit('mcpAutoStart', id);
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize persistence service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async saveData(data: MCPConfig): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.configFilePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadData(): Promise<MCPConfig> {
    try {
      const data = await fs.promises.readFile(this.configFilePath, 'utf-8');
      return JSON.parse(data) as MCPConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Configuration file not found');
      }
      throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async backupData(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.dataDir, `config.${timestamp}.backup.json`);
      await fs.promises.copyFile(this.configFilePath, backupPath);
    } catch (error) {
      throw new Error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}