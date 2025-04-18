import { Controller, Get, Post } from '../decorators';
import { FileConfigService } from '../services/configService';
import { MCPConfig } from '../types/config';
import { z } from 'zod';
import { Context } from 'koa';

const configService = new FileConfigService();

const idParamsSchema = z.object({ id: z.string() });
const configBodySchema = z.object({
  serverUrl: z.string(),
  apiKey: z.string().optional(),
  debug: z.boolean().optional(),
  transport: z.enum(['stdio', 'http']).optional(),
  mcpServers: z.record(z.string(), z.any())
});

@Controller('/config')
export class ConfigController {
  @Get('/')
  async getConfig(ctx: Context) {
    const config = await configService.loadConfig();
    ctx.body = { code: 0, message: 'success', data: config };
  }

  @Get('/list')
  async getConfigList(ctx: Context) {
    const list = await configService.getConfigList();
    ctx.body = { code: 0, message: 'success', data: list };
  }

  @Get('/services/status')
  async getServicesStatus(ctx: Context) {
    const configList = await configService.getConfigList();
    ctx.body = { code: 0, message: 'success', data: configList.map(config => ({
      id: config.id,
      name: config.name,
      isRunning: config.isRunning
    })) };
  }

  @Get('/:id')
  async getConfigById(ctx: Context) {
    try {
      const params = idParamsSchema.parse(ctx.params);
      const id = params.id;
      const config = await configService.loadConfig();
      if (!config.mcpServers || !config.mcpServers[id]) {
        ctx.status = 404;
        ctx.body = { code: 1, message: `MCP configuration with ID ${id} not found`, data: null };
        return;
      }
      const serverConfig = config.mcpServers[id];
      const isRunning = await configService.isMCPRunning(id);
      ctx.body = { code: 0, message: 'success', data: {
        ...config,
        id,
        name: serverConfig.name,
        isRunning,
        selectedServer: { [id]: serverConfig }
      }};
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { code: 1, message: err.message, data: null };
    }
  }

  @Post('/toggle/:id')
  async toggleConfig(ctx: Context) {
    try {
      const params = idParamsSchema.parse(ctx.params);
      const id = params.id;
      const newStatus = await configService.toggleMCPStatus(id);
      ctx.body = { code: 0, message: 'success', data: { id, isRunning: newStatus } };
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { code: 1, message: err.message, data: null };
    }
  }

  @Post('/capabilities/:id')
  async getCapabilities(ctx: Context) {
    try {
      const params = idParamsSchema.parse(ctx.params);
      const id = params.id;
      const data = await configService.capabilities(id);
      ctx.body = { code: 0, message: 'success', data };
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { code: 1, message: err.message, data: null };
    }
  }

  @Post('/')
  async saveConfig(ctx: Context) {
    try {
      const body = configBodySchema.parse(ctx.request.body);
      await configService.saveConfig(body as MCPConfig);
      ctx.body = { code: 0, message: 'Configuration saved successfully', data: null };
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { code: 1, message: err.message, data: null };
    }
  }
}

// 不再导出 router，Controller 装饰器注册路由