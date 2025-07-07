import { AppSettingService } from '../services/AppSettingService';
import { PersistenceService } from '../services/PersistenceService';
import { CryptoUtil } from '../utils/CryptoUtil';
import fs from 'fs';
import path from 'path';

// Mock the dependencies
jest.mock('../services/PersistenceService');
jest.mock('../utils/CryptoUtil');

describe('AppSettingService', () => {
  let appSettingService: AppSettingService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;
  const testDataDir = path.join(__dirname, 'test-app-settings');

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockPersistenceService = new PersistenceService({} as any) as jest.Mocked<PersistenceService>;
    
    // Mock the constructor to return our mocks
    (PersistenceService as jest.MockedClass<typeof PersistenceService>).mockImplementation(() => mockPersistenceService);
    
    // Setup default mock implementations
    mockPersistenceService.loadData = jest.fn();
    mockPersistenceService.saveData = jest.fn();
    
    // Mock CryptoUtil static methods
    jest.spyOn(CryptoUtil, 'encrypt').mockImplementation((data: string) => `encrypted-${data}`);
    jest.spyOn(CryptoUtil, 'decrypt').mockImplementation((data: string) => data.replace('encrypted-', ''));
    
    appSettingService = new AppSettingService({ dataDir: testDataDir });
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

  test('should load settings correctly', async () => {
    const mockSettings = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: 'encrypted-key',
        models: [{ id: 'gpt-4', name: 'GPT-4', enabled: true, providerId: 'openai' }]
      }]
    };
    
    mockPersistenceService.loadData.mockResolvedValue(mockSettings);
    
    const settings = await appSettingService.getAppSetting();
    
    expect(mockPersistenceService.loadData).toHaveBeenCalled();
    expect(settings.providers[0].apiKey).toBe('key');
  });

  test('should return default settings when no settings file exists', async () => {
    mockPersistenceService.loadData.mockResolvedValue(null);
    
    const settings = await appSettingService.getAppSetting();
    
    expect(settings).toEqual({
      providers: []
    });
  });

  test('should save settings correctly', async () => {
    const settingsToSave = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: 'test-key',
        models: [{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true, providerId: 'openai' }]
      }]
    };
    
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    await appSettingService.saveAppSetting(settingsToSave);
    
    expect(mockPersistenceService.saveData).toHaveBeenCalled();
    expect(CryptoUtil.encrypt).toHaveBeenCalledWith('test-key');
  });

  test('should encrypt API key when saving provider settings', async () => {
    const apiKey = 'sk-test-api-key';
    const encryptedKey = 'encrypted-api-key';
    
    const settingsToSave = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: apiKey,
        models: []
      }]
    };
    
    mockPersistenceService.saveData.mockResolvedValue(undefined);
    
    await appSettingService.saveAppSetting(settingsToSave);
    
    expect(CryptoUtil.encrypt).toHaveBeenCalledWith(apiKey);
    expect(mockPersistenceService.saveData).toHaveBeenCalled();
  });

  test('should encrypt and decrypt API keys correctly', async () => {
    const apiKey = 'test-api-key-123';
    const encryptedKey = 'encrypted-test-api-key-123';
    
    const mockSettings = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: encryptedKey,
        models: []
      }]
    };
    
    mockPersistenceService.loadData.mockResolvedValue(mockSettings);
    
    const result = await appSettingService.getAppSetting();
    
    expect(result.providers[0].apiKey).toBe(apiKey);
    expect(CryptoUtil.decrypt).toHaveBeenCalledWith(encryptedKey);
  });

  test('should handle empty providers array', async () => {
    mockPersistenceService.loadData.mockResolvedValue({
      providers: []
    });
    
    const result = await appSettingService.getAppSetting();
    
    expect(result.providers).toEqual([]);
  });

  test('should handle encryption errors gracefully', async () => {
    const apiKey = 'sk-test-api-key';
    
    const settingsToSave = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: apiKey,
        models: []
      }]
    };
    
    jest.spyOn(CryptoUtil, 'encrypt').mockImplementation(() => {
      throw new Error('Encryption failed');
    });
    
    await expect(appSettingService.saveAppSetting(settingsToSave))
      .rejects.toThrow('保存应用设置失败');
  });

  test('should handle decryption errors gracefully', async () => {
    const mockSettings = {
      providers: [{
        id: 'openai',
        name: 'OpenAI',
        apiKey: 'corrupted-encrypted-key',
        models: []
      }]
    };
    
    mockPersistenceService.loadData.mockResolvedValue(mockSettings);
    jest.spyOn(CryptoUtil, 'decrypt').mockImplementation(() => {
      throw new Error('Decryption failed');
    });
    
    const result = await appSettingService.getAppSetting();
    
    // Should return empty apiKey when decryption fails
    expect(result.providers[0].apiKey).toBe('');
  });
});