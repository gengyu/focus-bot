import { FileParserService } from '../services/FileParserService';
import fs from 'fs';
import path from 'path';

describe('FileParserService', () => {
  let fileParserService: FileParserService;
  const testDir = path.join(__dirname, 'test-files');

  beforeAll(() => {
    fileParserService = FileParserService.getInstance();
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
  });

  afterAll(() => {
    // 清理测试文件
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('应该能正确解析文本文件', async () => {
    const testFile = path.join(testDir, 'test.txt');
    const testContent = '这是一个测试文本文件';
    fs.writeFileSync(testFile, testContent);

    const result = await fileParserService.parseFile(testFile);
    expect(result).toBe(testContent);
  });

  test('应该能正确解析JSON文件', async () => {
    const testFile = path.join(testDir, 'test.json');
    const testObj = { test: '这是一个测试JSON文件' };
    fs.writeFileSync(testFile, JSON.stringify(testObj));

    const result = await fileParserService.parseFile(testFile);
    expect(result).toContain('test');
    expect(result).toContain('这是一个测试JSON文件');
  });

  test('应该抛出错误当文件不存在时', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent.txt');
    await expect(fileParserService.parseFile(nonExistentFile)).rejects.toThrow('文件不存在');
  });

  test('应该抛出错误当文件格式不支持时', async () => {
    const unsupportedFile = path.join(testDir, 'test.xyz');
    fs.writeFileSync(unsupportedFile, 'test content');

    await expect(fileParserService.parseFile(unsupportedFile)).rejects.toThrow('不支持的文件格式');
  });

  test('应该正确处理大文本文件', async () => {
    const testFile = path.join(testDir, 'large.txt');
    const largeContent = 'a'.repeat(150000); // 创建超过最大长度限制的内容
    fs.writeFileSync(testFile, largeContent);

    const result = await fileParserService.parseFile(testFile);
    expect(result.length).toBeLessThan(150000);
    expect(result).toContain('...(内容已截断)');
  });
});