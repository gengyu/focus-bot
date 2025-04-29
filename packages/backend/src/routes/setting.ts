import {Body, Controller, Get, Param, Post, Service} from '../decorators/decorators.ts';
import {FileConfigService} from '../services/AppSettingService.ts';
import {ResultHelper} from './routeHelper';
import {ChatService} from "../services/ChatService.ts";
import {ProviderConfig} from "../../../../share/type.ts";


const configService = new FileConfigService();


@Controller('/invoke/setting')
export class SettingController {

  @Post('/getModels')
  async getModels(@Body() modelConfig: ProviderConfig) {
    const llmService = new ChatService(modelConfig as any);
    const config = await llmService.getModels();
    return ResultHelper.success(config);
  }

}

