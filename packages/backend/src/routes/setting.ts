import {Body, Controller, Get, Param, Post, Service} from '../decorators';
import {FileConfigService} from '../services/configService';
import {ResultHelper} from './routeHelper';
import {LLMService, ProviderConfig} from "../services/LLMService.ts";

const configService = new FileConfigService();


@Controller('/invoke/setting')
export class SettingController {

  @Post('/getModels')
  async getModels(@Body() modelConfig: ProviderConfig) {
    const llmService = new LLMService(modelConfig);
    const config = await llmService.getModels();
    return ResultHelper.success(config);
  }

}

