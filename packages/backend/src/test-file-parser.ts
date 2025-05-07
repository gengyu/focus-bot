import { FileParserService } from './services/FileParserService';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

/**
 * 测试FileParserService的功能
 */
async function testFileParser() {
  try {
    // 获取FileParserService实例
    const fileParserService = FileParserService.getInstance();
    console.log('FileParserService实例创建成功');

    // 创建测试文件目录
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // 创建测试文本文件
    const textFilePath = path.join(testDir, 'test.txt');
    fs.writeFileSync(textFilePath, '这是一个测试文本文件\n包含多行内容\n用于测试文件解析功能');

    // 创建测试JSON文件
    const jsonFilePath = path.join(testDir, 'test.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify({ name: '测试', value: 123, items: [1, 2, 3] }, null, 2));

    // 创建测试CSV文件
    const csvFilePath = path.join(testDir, 'test.csv');
    fs.writeFileSync(csvFilePath, '姓名,年龄,城市\n张三,25,北京\n李四,30,上海\n王五,28,广州');

    // 创建测试HTML文件
    const htmlFilePath = path.join(testDir, 'test.html');
    fs.writeFileSync(htmlFilePath, '<html><head><title>测试页面</title></head><body><h1>测试标题</h1><p>这是一个测试段落</p></body></html>');

    console.log('测试文件创建完成');

    // 测试文本文件解析
    console.log('\n===== 测试文本文件解析 =====');
    const textContent = await fileParserService.parseFile(textFilePath);
    console.log('文本文件内容:', textContent);

    // 测试JSON文件解析
    console.log('\n===== 测试JSON文件解析 =====');
    const jsonContent = await fileParserService.parseFile(jsonFilePath);
    console.log('JSON文件内容:', jsonContent);

    // 测试CSV文件解析
    console.log('\n===== 测试CSV文件解析 =====');
    const csvContent = await fileParserService.parseFile(csvFilePath);
    console.log('CSV文件内容:', csvContent);

    // 测试HTML文件解析
    console.log('\n===== 测试HTML文件解析 =====');
    const htmlContent = await fileParserService.parseFile(htmlFilePath);
    console.log('HTML文件内容:', htmlContent);

    // 测试带元信息的文件解析
    console.log('\n===== 测试带元信息的文件解析 =====');
    const textResult = await fileParserService.parseFile(textFilePath, true);
    console.log('文本文件解析结果(带元信息):', JSON.stringify(textResult, null, 2));

    // 测试获取文件元信息
    console.log('\n===== 测试获取文件元信息 =====');
    const metadata = await fileParserService.getFileMetadata(textFilePath);
    console.log('文件元信息:', JSON.stringify(metadata, null, 2));

    console.log('\n所有测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testFileParser().catch(console.error);