import { FileConfigService } from '../mcp/mcp.service';
import { MCPConfig } from '../types/config';
import fs from 'fs';
import path from 'path';

describe('FileConfigService', () => {
  let configService: FileConfigService;
  const testDataDir = path.join(__dirname, 'test-data');

  beforeEach(() => {
    // 确保测试目录存在
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    configService = new FileConfigService({ dataDir: testDataDir });
  });

  afterEach(async () => {
    try {
      if (fs.existsSync(testDataDir)) {
        await fs.promises.rm(testDataDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to cleanup test directory:', error);
    }
  });

  test('should save and load config correctly', async () => {
    const config: MCPConfig = {
      serverUrl: 'http://localhost:5000',
      transport: 'http',
      debug: false,
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['test.js'],
          name: 'Test Server'
        }
      }
    };

    await configService.saveConfig(config);
    const loadedConfig = await configService.loadConfig();

    expect(loadedConfig.serverUrl).toBe(config.serverUrl);
    expect(loadedConfig.transport).toBe(config.transport);
    expect(loadedConfig.debug).toBe(config.debug);
    expect(loadedConfig.mcpServers).toEqual(config.mcpServers);
  });

  test('should return default config when file not exists', async () => {
    const config = await configService.loadConfig();
    expect(config.serverUrl).toBe('http://localhost:5000');
    expect(config.transport).toBe('http');
    expect(config.debug).toBe(false);
    expect(config.mcpServers).toEqual({});
  });

  test('should validate config correctly', () => {
    const validConfig: MCPConfig = {
      serverUrl: 'http://localhost:5000',
      transport: 'http',
      debug: false,
      mcpServers: {}
    };
    
    const result = configService.validateConfig(validConfig);
    expect(result.isValid).toBe(true);
  });
});