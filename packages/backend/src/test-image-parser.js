// 使用CommonJS方式导入
const fs = require('fs');
const path = require('path');

// 由于FileParserService是TypeScript模块，需要特殊处理
const FileParserServiceModule = require('./services/FileParserService');
const FileParserService = FileParserServiceModule.FileParserService;

async function testImageParser() {
  try {
    // 获取FileParserService实例
    const fileParserService = FileParserService.getInstance();
    console.log('FileParserService实例创建成功');

    // 创建测试文件目录
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // 创建一个简单的测试图片文件
    const imagePath = path.join(testDir, 'test-image.jpg');
    
    // 如果测试图片不存在，创建一个空文件（仅用于测试）
    if (!fs.existsSync(imagePath)) {
      // 这里我们只是创建一个空文件，实际测试时可能需要一个真实的图片
      fs.writeFileSync(imagePath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]));
      console.log('创建了测试图片文件（仅用于测试）');
    }

    // 测试图片解析功能
    console.log('\n===== 测试图片解析功能 =====');
    try {
      const imageContent = await fileParserService.parseFile(imagePath);
      console.log('图片解析结果:');
      console.log(imageContent);
    } catch (error) {
      console.error('图片解析出错:', error.message);
    }

    console.log('\n测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testImageParser().catch(console.error);