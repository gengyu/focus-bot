import {Body, Controller, Get, Param, Post} from '../decorators';
import {ConfigService, FileConfigService} from '../services/configService';
import {ResultHelper} from './routeHelper';
import {ModelConfig} from "../../../../share/type.ts";

const fileConfigService = new FileConfigService();
const configService = new ConfigService();


@Controller('/invoke/config')
export class ConfigController {

  @Post('/saveModelConfig')
  async saveModelConfig(@Body() configs: ModelConfig) {
    const config = await configService.saveModelConfig(configs);
    return ResultHelper.success(config);
  }

  @Post('/getModelConfig')
  async getModelConfig() {
    const config = await configService.getModelConfig();
    return ResultHelper.success(config);
  }


  @Get('/')
  async getConfig() {
    const config = await fileConfigService.loadConfig();
    return ResultHelper.success(config);
  }

  @Post('/list')
  async getConfigList() {
    const list = await fileConfigService.getConfigList();
    return ResultHelper.success(list);
  }

  @Get('/services/status')
  async getServicesStatus() {
    const configList = await fileConfigService.getConfigList();
    return ResultHelper.success(configList.map(config => ({
      id: config.id,
      name: config.name,
      isRunning: config.isRunning
    })));
  }

  @Post('/loadConfig')
  async getConfigById(@Param('id') id: string) {
    try {
      const config = await fileConfigService.loadConfig();
      if (!config.mcpServers || !config.mcpServers[id]) {
        return ResultHelper.fail(`MCP configuration with ID ${id} not found`, null);
      }
      const serverConfig = config.mcpServers[id];
      const isRunning = await fileConfigService.isMCPRunning(id);
      return ResultHelper.success({
        ...config,
        id,
        name: serverConfig.name,
        isRunning,
        selectedServer: { [id]: serverConfig }
      });
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/toggle/:id')
  async toggleConfig(@Param('id') id: string) {
    try {
      const newStatus = await fileConfigService.toggleMCPStatus(id);
      return ResultHelper.success({ id, isRunning: newStatus });
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/capabilities/:id')
  async getCapabilities(@Param('id') id: string) {
    try {
      const data = await fileConfigService.capabilities(id);
      return ResultHelper.success(data);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/')
  async saveConfig( config: any) {
    try {
      await fileConfigService.saveConfig(config);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由