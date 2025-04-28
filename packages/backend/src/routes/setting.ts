import {Body, Controller, Get, Param, Post, Service} from '../decorators';
import {FileConfigService} from '../services/configService';
import {ResultHelper} from './routeHelper';
import {LLMService} from "../services/LLMService";
import {ProviderConfig} from "../../../../share/type.ts";


const configService = new FileConfigService();


@Controller('/invoke/setting')
export class SettingController {

  @Post('/getModels')
  async getModels(@Body() modelConfig: ProviderConfig) {
    const llmService = new LLMService(modelConfig as any);
    const config = await llmService.getModels();
    return ResultHelper.success(config);
  }

}

