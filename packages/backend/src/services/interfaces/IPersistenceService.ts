import { EventEmitter } from 'events';

export interface PersistenceOptions {
  dataDir?: string;
  configFileName: string;
  backupInterval?: number;
  maxBackups?: number;
}

export interface IPersistenceService<T = any> {
  // 数据操作
  saveData(data: T, id?: string): Promise<void>;
  loadData(id?: string): Promise<T>;
  
  // 备份管理
  startAutoBackup(): void;
  stopAutoBackup(): void;
  
  // 初始化
  initialize(): Promise<void>;
  
  // 事件处理
  on(event: string | symbol, listener: (...args: any[]) => void): void;
  off(event: string | symbol, listener: (...args: any[]) => void): void;
  emit(event: string | symbol, ...args: any[]): boolean;
}

// 持久化服务工厂接口
export interface IPersistenceServiceFactory {
  createPersistenceService<T>(options: PersistenceOptions): IPersistenceService<T>;
}