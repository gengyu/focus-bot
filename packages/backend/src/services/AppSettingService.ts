import {PersistenceOptions, PersistenceService} from './PersistenceService.ts';
import path from "path";
import {ProviderConfig} from "../../../../share/type";
import {KnowledgeBase} from "../../../../share/knowledge";
import {Singleton} from '../decorators/Singleton';
import { CryptoUtil } from '../utils/CryptoUtil';
import {AppSettings} from "../../../../share/appSettings.ts";

@Singleton()
export class AppSettingService {

  private persistenceService: PersistenceService<AppSettings>;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService<AppSettings>({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'settting.json',
    });

  }

  async getProviderConfig(): Promise<ProviderConfig[]> {
    const config = await this.getAppSetting();
    return config?.providers;
  }

  async getAppSetting(): Promise<AppSettings> {
    try {
      const setting = await this.persistenceService.loadData() ?? {
        providers: [],
        searchEngines: [],
        knowledgeBases: []
      };

      // 解密所有provider的apiKey
      if (setting.providers) {
        setting.providers = setting.providers.map(provider => {
          try {
            const apiKey =  provider.apiKey  ? CryptoUtil.decrypt(provider.apiKey) : '';
            return {
              ...provider,
              apiKey,
            }
          }catch (e) {
            return {
              ...provider,
              apiKey: '',
            }
          }
        });
      }

      return setting;
    } catch (error) {
      throw new Error(`加载应用设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async saveAppSetting(configs: AppSettings): Promise<void> {
    try {
      // 深拷贝配置对象，避免修改原始数据
      const configsToSave:AppSettings = JSON.parse(JSON.stringify(configs));

      configsToSave.providers.forEach((provider) => {
        // 加密apiKey
        if (provider.apiKey) {
          provider.apiKey = CryptoUtil.encrypt(provider.apiKey);
        }

        provider.models.forEach((model) => {
          model.enabled = model.enabled ?? true;
          model.providerId = provider.id
        })
      })

      // 确保knowledgeBases字段存在
      if (!configsToSave.knowledgeBases) {
        configsToSave.knowledgeBases = [];
      }

      await this.persistenceService.saveData(configsToSave);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(`保存应用设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取知识库列表
   */
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const setting = await this.getAppSetting();
    return setting.knowledgeBases || [];
  }

  /**
   * 添加知识库
   */
  async addKnowledgeBase(knowledgeBase: KnowledgeBase): Promise<void> {
    const setting = await this.getAppSetting();
    if (!setting.knowledgeBases) {
      setting.knowledgeBases = [];
    }
    
    // 检查是否已存在相同ID的知识库
    const existingIndex = setting.knowledgeBases.findIndex(kb => kb.id === knowledgeBase.id);
    if (existingIndex >= 0) {
      // 更新现有知识库
      setting.knowledgeBases[existingIndex] = knowledgeBase;
    } else {
      // 添加新知识库
      setting.knowledgeBases.push(knowledgeBase);
    }
    
    await this.saveAppSetting(setting);
  }

  /**
   * 删除知识库
   */
  async removeKnowledgeBase(knowledgeBaseId: string): Promise<boolean> {
    const setting = await this.getAppSetting();
    if (!setting.knowledgeBases) {
      return false;
    }
    
    const initialLength = setting.knowledgeBases.length;
    setting.knowledgeBases = setting.knowledgeBases.filter(kb => kb.id !== knowledgeBaseId);
    
    if (setting.knowledgeBases.length < initialLength) {
      await this.saveAppSetting(setting);
      return true;
    }
    
    return false;
  }

  /**
   * 更新知识库
   */
  async updateKnowledgeBase(knowledgeBase: KnowledgeBase): Promise<boolean> {
    const setting = await this.getAppSetting();
    if (!setting.knowledgeBases) {
      return false;
    }
    
    const index = setting.knowledgeBases.findIndex(kb => kb.id === knowledgeBase.id);
    if (index >= 0) {
      setting.knowledgeBases[index] = knowledgeBase;
      await this.saveAppSetting(setting);
      return true;
    }
    
    return false;
  }

  /**
   * 获取单个知识库
   */
  async getKnowledgeBase(knowledgeBaseId: string): Promise<KnowledgeBase | undefined> {
    const setting = await this.getAppSetting();
    return setting.knowledgeBases?.find(kb => kb.id === knowledgeBaseId);
  }
}




