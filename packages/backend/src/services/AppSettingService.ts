import {PersistenceOptions, PersistenceService} from './PersistenceService.ts';
import path from "path";
import {AppSetting, ProviderConfig} from "../../../../share/type";
import { Singleton } from '../decorators/Singleton';

@Singleton()
export class AppSettingService {

	private persistenceService: PersistenceService<AppSetting>;

	constructor(options?: PersistenceOptions) {
		this.persistenceService = new PersistenceService<AppSetting>({
			dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
			configFileName: 'settting.json',
			backupInterval: options?.backupInterval ?? 3600000, // 默认1小时
			maxBackups: options?.maxBackups ?? 24 // 默认24个备份
		});

	}

	async getProviderConfig(): Promise<ProviderConfig[]> {
		const config = await this.getAppSetting();
		return config?.providers;
	}

	async getAppSetting(): Promise<AppSetting> {
		try {
			return await this.persistenceService.loadData();
		} catch (error) {
			throw new Error(`加载应用设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
		}
	}

	async saveAppSetting(configs: AppSetting): Promise<void> {
		try {
			await this.persistenceService.saveData(configs);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return;
			}
			throw new Error(`保存应用设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
		}
	}
}




