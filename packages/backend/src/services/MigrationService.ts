import { PersistenceService } from './PersistenceService.ts';
import {KnowledgeBase, KnowledgeBaseStats} from '../../../../share/knowledge';
import path from 'path';
import fs from 'fs';
import { Singleton } from '../decorators/Singleton';
import {AppSettings} from "../../../../share/appSettings.ts";

/**
 * 数据迁移服务
 * 负责从JSON文件迁移数据到SQLite3数据库
 */
@Singleton()
export class MigrationService {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data');
  }

  /**
   * 执行所有迁移
   */
  async runMigrations(): Promise<void> {
    console.log('开始执行数据迁移...');
    
    try {
      await this.migrateAppSettings();
      await this.migrateKnowledgeBases();
      await this.migrateDialogs();
      console.log('数据迁移完成');
    } catch (error) {
      console.error('数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移应用设置
   */
  private async migrateAppSettings(): Promise<void> {
    const jsonPath = path.join(this.dataDir, 'settting.json');
    const sqlitePath = path.join(this.dataDir, 'settting.sqlite3');

    // 如果SQLite文件已存在，跳过迁移
    if (fs.existsSync(sqlitePath)) {
      console.log('应用设置已迁移，跳过');
      return;
    }

    // 如果JSON文件不存在，创建默认配置
    if (!fs.existsSync(jsonPath)) {
      console.log('未找到应用设置JSON文件，创建默认配置');
      const defaultSetting: AppSettings = {
        providers: [],
        searchEngines: [],
        knowledgeBases: []
      };
      
      const persistenceService = new PersistenceService<AppSettings>({
        dataDir: this.dataDir,
        configFileName: 'settting.json'
      });
      
      await persistenceService.saveData(defaultSetting);
      return;
    }

    try {
      // 读取JSON文件
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);

      // 确保包含knowledgeBases字段
      if (!jsonData.knowledgeBases) {
        jsonData.knowledgeBases = [];
      }

      // 创建PersistenceService并保存数据
      const persistenceService = new PersistenceService<AppSettings>({
        dataDir: this.dataDir,
        configFileName: 'settting.json'
      });

      await persistenceService.saveData(jsonData);
      console.log('应用设置迁移完成');

      // 备份原JSON文件
      const backupPath = path.join(this.dataDir, 'settting.json.backup');
      fs.copyFileSync(jsonPath, backupPath);
      console.log(`原JSON文件已备份到: ${backupPath}`);

      // 删除旧的JSON文件
      fs.rmSync(jsonPath);
      console.log(`已删除旧的JSON文件: ${jsonPath}`);

    } catch (error) {
      console.error('迁移应用设置失败:', error);
      throw error;
    }
  }
  

  /**
   * 迁移知识库配置
   */
  private async migrateKnowledgeBases(): Promise<void> {
    // 检查是否存在旧的知识库配置文件
    const knowledgeConfigPath = path.join(this.dataDir, 'knowledge-bases.json');
    
    if (!fs.existsSync(knowledgeConfigPath)) {
      console.log('未找到知识库配置文件，跳过知识库迁移');
      return;
    }

    try {
      // 读取旧的知识库配置
      const knowledgeContent = fs.readFileSync(knowledgeConfigPath, 'utf-8');
      const knowledgeBases: KnowledgeBaseStats[] = JSON.parse(knowledgeContent);

      // 获取当前应用设置
      const persistenceService = new PersistenceService<AppSettings>({
        dataDir: this.dataDir,
        configFileName: 'settting.json'
      });

      const appSetting = await persistenceService.loadData() || {
        providers: [],
        searchEngines: [],
        knowledgeBases: []
      };

      // 合并知识库配置
      appSetting.knowledgeBases = knowledgeBases;

      // 保存更新后的配置
      await persistenceService.saveData(appSetting);
      console.log(`迁移了 ${knowledgeBases.length} 个知识库配置`);

      // 备份原文件
      const backupPath = path.join(this.dataDir, 'knowledge-bases.json.backup');
      fs.copyFileSync(knowledgeConfigPath, backupPath);
      console.log(`原知识库配置文件已备份到: ${backupPath}`);

      // 删除旧的JSON文件
      fs.rmSync(knowledgeConfigPath);
      console.log(`已删除旧的知识库配置文件: ${knowledgeConfigPath}`);

    } catch (error) {
      console.error('迁移知识库配置失败:', error);
      throw error;
    }
  }

  /**
   * 迁移对话记录
   */
  private async migrateDialogs(): Promise<void> {
    // 检查是否存在旧的对话配置文件

  }



  /**
   * 检查是否需要迁移
   */
  needsMigration(): boolean {
    const sqlitePath = path.join(this.dataDir, 'settting.json');
    return fs.existsSync(sqlitePath);
  }

  /**
   * 获取迁移状态
   */
  getMigrationStatus(): {
    needsMigration: boolean;
    hasJsonBackup: boolean;
    hasKnowledgeBackup: boolean;
  } {
    const sqlitePath = path.join(this.dataDir, 'settting.sqlite3');
    const jsonBackupPath = path.join(this.dataDir, 'settting.json.backup');
    const knowledgeBackupPath = path.join(this.dataDir, 'knowledge-bases.json.backup');

    return {
      needsMigration: !fs.existsSync(sqlitePath),
      hasJsonBackup: fs.existsSync(jsonBackupPath),
      hasKnowledgeBackup: fs.existsSync(knowledgeBackupPath)
    };
  }
}