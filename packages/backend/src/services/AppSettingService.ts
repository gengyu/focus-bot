import {PersistenceOptions, PersistenceService} from './PersistenceService.ts';
import path from "path";
import {AppSetting, ProviderConfig} from "../../../../share/type";
import {Singleton} from '../decorators/Singleton';
import { CryptoUtil } from '../utils/CryptoUtil';

@Singleton()
export class AppSettingService {

  private persistenceService: PersistenceService<AppSetting>;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService<AppSetting>({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'settting.json',
    });

  }

  async getProviderConfig(): Promise<ProviderConfig[]> {
    const config = await this.getAppSetting();
    return config?.providers;
  }

  async getAppSetting(): Promise<AppSetting> {
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

  async saveAppSetting(configs: AppSetting): Promise<void> {
    try {
      // 深拷贝配置对象，避免修改原始数据
      const configsToSave:AppSetting = JSON.parse(JSON.stringify(configs));

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

      await this.persistenceService.saveData(configsToSave);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(`保存应用设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}




