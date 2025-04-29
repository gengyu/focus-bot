import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { Service } from '../container/decorators';
import { IPersistenceService, PersistenceOptions } from '../interfaces/IPersistenceService';

@Service('filePersistenceService')
export class FilePersistenceService<T = any> extends EventEmitter implements IPersistenceService<T> {
  private dataDir: string;
  private backupInterval: number;
  private configFileName: string;
  private maxBackups: number;
  private backupTimer: NodeJS.Timeout | null = null;

  constructor(options: PersistenceOptions) {
    super();
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.backupInterval = options.backupInterval || 3600000;
    this.maxBackups = options.maxBackups || 24;
    this.configFileName = options.configFileName;
  }

  async initialize(): Promise<void> {
    try {
      await fs.promises.mkdir(this.dataDir, { recursive: true });
      this.startAutoBackup();
    } catch (error) {
      throw new Error(`Failed to initialize persistence service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getConfigPath(id?: string): string {
    const configFileName = this.configFileName.replace('.json', '');
    const fileName = id ? `${configFileName}/${id}.json` : `${configFileName}.json`;
    return path.join(this.dataDir, fileName);
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async saveData(data: T, id?: string): Promise<void> {
    const filePath = this.getConfigPath(id);
    try {
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      this.emit('dataSaved', id);
    } catch (error) {
      throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadData(id?: string): Promise<T> {
    const filePath = this.getConfigPath(id);
    try {
      if (!(await this.exists(filePath))) {
        return {} as T;
      }
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Configuration file not found');
      }
      throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async backupData(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const files = await fs.promises.readdir(this.dataDir);
      const configFiles = files.filter(file => file.endsWith('.json') && !file.includes('.backup.'));

      for (const file of configFiles) {
        const sourcePath = path.join(this.dataDir, file);
        const backupFilePath = path.join(
          this.dataDir,
          `${file.replace('.json', '')}.${timestamp}.backup.json`
        );
        await fs.promises.copyFile(sourcePath, backupFilePath);
      }

      await this.cleanupOldBackups();
      this.emit('backupCompleted', timestamp);
    } catch (error) {
      console.error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.emit('backupError', error);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.dataDir);
      const backupFiles = files
        .filter(file => file.includes('.backup.json'))
        .map(file => ({
          name: file,
          path: path.join(this.dataDir, file),
          time: new Date(file.split('.')[1].replace(/-/g, ':'))
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);
        for (const file of filesToDelete) {
          await fs.promises.unlink(file.path);
        }
        this.emit('backupsCleaned', filesToDelete.length);
      }
    } catch (error) {
      console.error(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    this.backupTimer = setInterval(() => {
      this.backupData();
    }, this.backupInterval);
    this.emit('autoBackupStarted');
  }

  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      this.emit('autoBackupStopped');
    }
  }
}