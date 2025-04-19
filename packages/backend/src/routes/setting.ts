import {Controller, Get, Param, Post, Service} from '../decorators';
import {FileConfigService} from '../services/configService';
import {ResultHelper} from './routeHelper';
import {LLMService} from "../services/llmService";

const configService = new FileConfigService();


@Controller('/invoke/setting')
export class SettingController {

  @Post('/getModels')
  async getModels() {
    const config = await configService.loadConfig();
    return ResultHelper.success(config);
  }

}

