import Router from 'koa-router';
import { FileConfigService } from '../services/configService';
import { MCPConfig } from '../types/config';
import { z } from 'zod';
import { bindAndHandle } from './routeHelper';

const configService = new FileConfigService();
const router = new Router();

const idParamsSchema = z.object({ id: z.string() });
const configBodySchema = z.object({
  serverUrl: z.string(),
  apiKey: z.string().optional(),
  debug: z.boolean().optional(),
  transport: z.enum(['stdio', 'http']).optional(),
  mcpServers: z.record(z.string(), z.any())
});

router.get('/config', bindAndHandle({
  handler: async () => await configService.loadConfig()
}));

router.get('/config/list', bindAndHandle({
  handler: async () => await configService.getConfigList()
}));

router.get('/services/status', bindAndHandle({
  handler: async () => {
    const configList = await configService.getConfigList();
    return configList.map(config => ({
      id: config.id,
      name: config.name,
      isRunning: config.isRunning
    }));
  }
}));

router.get('/config/:id', bindAndHandle({
  paramsSchema: idParamsSchema,
  handler: async ({ params }) => {
    const id = params.id;
    const config = await configService.loadConfig();
    if (!config.mcpServers || !config.mcpServers[id]) {
      throw new Error(`MCP configuration with ID ${id} not found`);
    }
    const serverConfig = config.mcpServers[id];
    const isRunning = await configService.isMCPRunning(id);
    return {
      ...config,
      id,
      name: serverConfig.name,
      isRunning,
      selectedServer: { [id]: serverConfig }
    };
  }
}));

router.post('/config/toggle/:id', bindAndHandle({
  paramsSchema: idParamsSchema,
  handler: async ({ params }) => {
    const id = params.id;
    const newStatus = await configService.toggleMCPStatus(id);
    return { id, isRunning: newStatus };
  }
}));

router.post('/config/capabilities/:id', bindAndHandle({
  paramsSchema: idParamsSchema,
  handler: async ({ params }) => {
    const id = params.id;
    return await configService.capabilities(id);
  }
}));

router.post('/config', bindAndHandle({
  bodySchema: configBodySchema,
  handler: async ({ body }) => {
    await configService.saveConfig(body as MCPConfig);
    return { message: 'Configuration saved successfully' };
  }
}));

export default router;