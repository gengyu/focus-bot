import { FileConfigService } from '../services/configService';
import { MCPConfig } from '../types/config';
import fs from 'fs';
import path from 'path';

describe('FileConfigService', () => {
  let configService: FileConfigService;
  const testConfigPath = path.join(__dirname, 'test-config.json');

  beforeEach(() => {
    configService = new FileConfigService({ filePath: testConfigPath });
  });

  afterEach(async () => {
    try {
      await fs.promises.unlink(testConfigPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  });

  test('should save and load config correctly', async () => {
    const config: MCPConfig = {
      serverUrl: 'http://localhost:5000',
      transport: 'http',
      debug: false
    };

    await configService.saveConfig(config);
    const loadedConfig = await configService.loadConfig();

    expect(loadedConfig).toEqual(config);
  });

  test('should return default config when file not exists', async () => {
    const config = await configService.loadConfig();
    expect(config).toEqual({
      serverUrl: 'http://localhost:5000',
      transport: 'http',
      debug: false
    });
  });

  test('should throw error when config is invalid', async () => {
    const invalidConfig = { serverUrl: 'invalid-url' } as MCPConfig;
    await expect(configService.saveConfig(invalidConfig)).rejects.toThrow();
  });
});