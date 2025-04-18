import {Body, Controller, Get, Param, Post} from '../decorators';
import {FileConfigService} from '../services/configService';
import {ResultHelper} from './routeHelper';

const configService = new FileConfigService();


@Controller('/invoke/config')
export class ConfigController {
  @Get('/')
  async getConfig() {
    const config = await configService.loadConfig();
    return ResultHelper.success(config);
  }

  @Post('/list')
  async getConfigList() {
    const list = await configService.getConfigList();
    return ResultHelper.success(list);
  }

  @Get('/services/status')
  async getServicesStatus() {
    const configList = await configService.getConfigList();
    return ResultHelper.success(configList.map(config => ({
      id: config.id,
      name: config.name,
      isRunning: config.isRunning
    })));
  }

  @Post('/loadConfig')
  async getConfigById(@Param('id') id: string) {
    try {
      const config = await configService.loadConfig();
      if (!config.mcpServers || !config.mcpServers[id]) {
        return ResultHelper.fail(`MCP configuration with ID ${id} not found`, null);
      }
      const serverConfig = config.mcpServers[id];
      const isRunning = await configService.isMCPRunning(id);
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
      const newStatus = await configService.toggleMCPStatus(id);
      return ResultHelper.success({ id, isRunning: newStatus });
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/capabilities/:id')
  async getCapabilities(@Param('id') id: string) {
    try {
      const data = await configService.capabilities(id);
      return ResultHelper.success(data);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/')
  async saveConfig(@Body() config: any) {
    try {
      await configService.saveConfig(config);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由