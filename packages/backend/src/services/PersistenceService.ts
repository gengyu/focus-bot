// import Database from 'better-sqlite3'; // 暂时禁用
import path from 'path';
import fs from 'fs';

export interface PersistenceOptions {
  dataDir?: string;
  configFileName: string;
}

export class PersistenceService<T = any> {
  private storage: Map<string, string> = new Map(); // 使用内存存储
  private tableName: string;
  private filePath: string;

  constructor(options: PersistenceOptions) {
    const dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.tableName = options.configFileName.replace(/\.json$/, '');
    this.filePath = path.join(dataDir, options.configFileName);
    this.initialize();
  }

  private initialize() {
    // 确保数据目录存在
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 尝试从文件加载数据
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        Object.entries(data).forEach(([key, value]) => {
          this.storage.set(key, JSON.stringify(value));
        });
      }
    } catch (error) {
      console.warn('Failed to load persistence data:', error);
    }
  }

  async saveData(data: T, id?: string): Promise<void> {
    const key = id || 'default';
    const value = JSON.stringify(data);
    this.storage.set(key, value);
    
    // 保存到文件
    try {
      const allData: Record<string, any> = {};
      this.storage.forEach((value, key) => {
        allData[key] = JSON.parse(value);
      });
      fs.writeFileSync(this.filePath, JSON.stringify(allData, null, 2));
    } catch (error) {
      console.warn('Failed to save persistence data:', error);
    }
  }

  async loadData(id?: string): Promise<T | undefined> {
    const key = id || 'default';
    const value = this.storage.get(key);
    if (!value) return undefined;
    return JSON.parse(value) as T;
  }
}