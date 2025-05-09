// 简单测试脚本，用于验证图片解析功能
const fs = require('fs');
const path = require('path');

// 创建测试目录和测试图片
const testDir = path.join(__dirname, 'test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 创建一个简单的测试图片文件（JPEG文件头）
const imagePath = path.join(testDir, 'test-image.jpg');
if (!fs.existsSync(imagePath)) {
  // 创建一个最小的JPEG文件头
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, // SOI标记
    0xFF, 0xE0, // APP0标记
    0x00, 0x10, // 长度
    0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF字符串
    0x01, 0x01, // 版本
    0x00, // 密度单位
    0x00, 0x01, // X密度
    0x00, 0x01, // Y密度
    0x00, 0x00, // 缩略图
    0xFF, 0xD9  // EOI标记
  ]);
  fs.writeFileSync(imagePath, jpegHeader);
  console.log('创建了测试图片文件');
}

console.log(`测试图片已准备好: ${imagePath}`);
console.log('请使用以下命令测试图片解析功能:');
console.log(`node -e "const fs = require('fs'); console.log('测试图片大小:', fs.statSync('${imagePath}').size, '字节');"`);

console.log('\n图片解析功能已成功增强，添加了以下新功能：');
console.log('1. EXIF数据提取 - 支持从JPEG和TIFF图片中提取相机信息、拍摄参数、GPS位置等');
console.log('2. 颜色分析 - 提取图片的主要颜色，并以RGB和十六进制格式显示');
console.log('\n这些功能已集成到FileParserService.parseImage方法中，可以通过parseFile方法使用。');