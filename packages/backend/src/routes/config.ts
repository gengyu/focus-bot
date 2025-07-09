import {Body, Controller, Post} from '../decorators/decorators.ts';
import {AppSettingService} from '../services/AppSettingService.ts';
import {ResultHelper} from './routeHelper';
import {ProviderConfig, ProviderId} from "../../../../share/type";
import {ChatService} from "../services/ChatService.ts";
import {AppSettings} from "../../../../share/appSettings.ts";

// const fileConfigService = new FileConfigService();

@Controller('/invoke/config')
export class ConfigController {
	private chatService: ChatService;
	// private dialogService: DialogStateService;
	// private chatHistoryService: ChatHistoryService;
	private appSettingService: AppSettingService;

	constructor() {
		this.chatService = new ChatService();
		this.appSettingService = new AppSettingService();
	}

	@Post('/getAppSetting')
	async getAppSetting() {
		const config = await this.appSettingService.getAppSetting();
		return ResultHelper.success(config);
	}

	@Post('/saveAppSetting')
	async saveAppSetting(@Body() configs: AppSettings) {
		await this.appSettingService.saveAppSetting(configs);
		return ResultHelper.success();
	}

	@Post('/getModels')
	async getModels(@Body('providerId') id: ProviderId) {
		try {
			const models = await this.chatService.getModels(id);
			return ResultHelper.success(models);
		}catch (err) {
			return ResultHelper.fail(err, null);
		}
	}
}
