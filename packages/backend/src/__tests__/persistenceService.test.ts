import { PersistenceService } from '../services/PersistenceService';
import fs from 'fs';
import path from 'path';

describe('PersistenceService', () => {
  let persistenceService: PersistenceService<any>;
  const testDataDir = path.join(__dirname, 'test-persistence-data');
  const testConfigFileName = 'test-config.json';

  beforeEach(async () => {
    // 确保测试目录存在
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    persistenceService = new PersistenceService({
      dataDir: testDataDir,
      configFileName: testConfigFileName,
      backupInterval: 1000,
      maxBackups: 5
    });
    
    await persistenceService.initialize();
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

  test('should save and load data correctly', async () => {
    const testData = {
      name: 'test',
      value: 123,
      nested: {
        prop: 'value'
      }
    };

    await persistenceService.saveData(testData);
    const loadedData = await persistenceService.loadData();

    expect(loadedData).toEqual(testData);
  });

  test('should return undefined when data file does not exist', async () => {
    const loadedData = await persistenceService.loadData();
    expect(loadedData).toBeUndefined();
  });

  test('should save and load data with ID', async () => {
    const testData = { message: 'hello world' };
    const testId = 'test-id-123';

    await persistenceService.saveData(testData, testId);
    const loadedData = await persistenceService.loadData(testId);

    expect(loadedData).toEqual(testData);
  });

  test('should handle multiple data entries with different IDs', async () => {
    const data1 = { type: 'config1', value: 'test1' };
    const data2 = { type: 'config2', value: 'test2' };
    
    await persistenceService.saveData(data1, 'config1');
    await persistenceService.saveData(data2, 'config2');
    
    const loaded1 = await persistenceService.loadData('config1');
    const loaded2 = await persistenceService.loadData('config2');
    
    expect(loaded1).toEqual(data1);
    expect(loaded2).toEqual(data2);
  });

  test('should handle JSON serialization correctly', async () => {
    const complexData = {
      string: 'test string',
      number: 42,
      boolean: true,
      array: [1, 2, 3, 'four'],
      object: {
        nested: {
          deep: 'value'
        }
      },
      nullValue: null
    };

    await persistenceService.saveData(complexData);
    const loadedData = await persistenceService.loadData();

    expect(loadedData).toEqual(complexData);
  });

  test('should throw error when saving fails', async () => {
    // 创建一个无效的数据目录路径
    const invalidService = new PersistenceService({
      dataDir: '/invalid/path/that/does/not/exist',
      configFileName: 'test.json'
    });

    const testData = { test: 'data' };
    
    await expect(invalidService.saveData(testData)).rejects.toThrow();
  });
});