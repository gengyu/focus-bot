import { FileParserService } from './services/FileParserService';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { promisify } from 'util';

// 使用Node.js的stream.pipeline，但兼容性更好的方式
const pipeline = promisify(require('stream').pipeline);

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

    // 创建一个简单的测试图片文件（如果不存在）
    const imagePath = path.join(testDir, 'test.jpg');
    if (!fs.existsSync(imagePath)) {
      try {
        // 使用一个示例图片URL，这里使用一个公共图片
        const imageUrl = 'https://picsum.photos/800/600';
        await downloadFile(imageUrl, imagePath);
        console.log('测试图片下载完成');
      } catch (error) {
        console.error('下载测试图片失败:', error);
        // 创建一个空图片文件，以便测试能继续
        fs.writeFileSync(imagePath, Buffer.from([]));
      }
    }

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

    // 测试图片解析（包含新增的EXIF和颜色分析功能）
    console.log('\n===== 测试图片解析（增强功能）=====');
    const imagePath = path.join(testDir, 'test.jpg');
    if (fs.existsSync(imagePath)) {
      const imageContent = await fileParserService.parseFile(imagePath);
      console.log('图片解析结果:');
      console.log(imageContent);

      // 测试带元信息的图片解析
      const imageResult = await fileParserService.parseFile(imagePath, true);
      console.log('图片解析结果(带元信息):', JSON.stringify(imageResult.metadata, null, 2));
    } else {
      console.log('测试图片不存在，跳过图片解析测试');
    }

    console.log('\n所有测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

/**
 * 下载文件的辅助函数
 */
async function downloadFile(url: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fileStream.close();
        reject(new Error(`下载失败，状态码: ${response.statusCode}`));
        return;
      }
      
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      fileStream.close();
      reject(err);
    });
  });
}

// 执行测试
testFileParser().catch(console.error);