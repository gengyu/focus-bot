import fs from 'fs';
import path from 'path';
import { MCPConfig } from '../types/config';

export interface PersistenceOptions {
  dataDir?: string;
  configFileName?: string;
  backupInterval?: number; // 备份间隔时间（毫秒），默认1小时
  maxBackups?: number; // 最大备份文件数量，默认24个
}

import { EventEmitter } from 'events';

export class PersistenceService extends EventEmitter {
  static readonly EVENT_MCP_AUTO_START = 'mcpAutoStart';
  private dataDir: string;
  private configFilePath: string;
  private backupInterval: number;
  private maxBackups: number;
  private backupTimer: NodeJS.Timeout | null = null;

  constructor(options?: PersistenceOptions) {
    super();
    this.dataDir = options?.dataDir || path.join(process.cwd(), 'data');
    this.configFilePath = path.join(this.dataDir, options?.configFileName || 'config.json');
    this.backupInterval = options?.backupInterval || 3600000; // 默认1小时
    this.maxBackups = options?.maxBackups || 24; // 默认24个备份
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

      // 启动自动备份定时器
      this.startAutoBackup();
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

  async loadData(): Promise<MCPConfig | any> {
    try {
      const data = await fs.promises.readFile(this.configFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Return empty array for chat history if file doesn't exist
        if (this.configFileName === 'chat_history.json') {
          return [];
        }
        throw new Error('Configuration file not found');
      }
      throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async backupData(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.dataDir, `config.${timestamp}.backup.json`);
      await fs.promises.copyFile(this.configFilePath, backupPath);

      // 清理过期备份
      await this.cleanupOldBackups();
    } catch (error) {
      console.error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.dataDir);
      const backupFiles = files
        .filter(file => file.match(/^config\..*\.backup\.json$/))
        .map(file => ({
          name: file,
          path: path.join(this.dataDir, file),
          time: new Date(file.split('.')[1].replace(/-/g, ':'))
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      // 删除超出最大数量的旧备份
      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);
        for (const file of filesToDelete) {
          await fs.promises.unlink(file.path);
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    this.backupTimer = setInterval(() => {
      this.backupData();
    }, this.backupInterval);
  }

  public stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}