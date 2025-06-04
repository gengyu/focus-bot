import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import pdfParse from 'pdf-parse';
import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import cheerio from 'cheerio';
import xml2js from 'xml2js';
import mammoth from 'mammoth';
//@ts-ignore
import {fileTypeFromFile} from 'file-type';
import {Readable} from 'stream';
import {promisify} from 'util';
import imageSize from 'image-size';
// @ts-ignore
import exifParser from 'exif-parser';
// @ts-ignore
import ColorThief from 'colorthief';
import {FileMetadata, MessageFile} from "../../../../share/type.ts";



export class FileParserService {
  private static instance: FileParserService;
  private metadataCache: Map<string, { metadata: FileMetadata; timestamp: number }>;
  private contentCache: Map<string, { content: string; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 缓存有效期5分钟
  private readonly MAX_CACHE_SIZE = 100; // 最大缓存条目数

  private constructor() {
    this.metadataCache = new Map();
    this.contentCache = new Map();
  }

  public static getInstance(): FileParserService {
    if (!FileParserService.instance) {
      FileParserService.instance = new FileParserService();
    }
    return FileParserService.instance;
  }

  /**
   * 获取文件元信息
   * @param filePath 文件路径
   * @returns 文件元信息
   */
  private cleanCache(cache: Map<string, any>): void {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        cache.delete(key);
      }
    }
    if (cache.size > this.MAX_CACHE_SIZE) {
      const entriesToDelete = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, cache.size - this.MAX_CACHE_SIZE);
      for (const [key] of entriesToDelete) {
        cache.delete(key);
      }
    }
  }

  public async getFileMetadata(filePath: string): Promise<FileMetadata> {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    const stats = fs.statSync(filePath);
    const cachedData = this.metadataCache.get(filePath);
    // @ts-ignore
    if (cachedData && stats.mtimeMs <= cachedData.metadata.modifiedAt) {
      return cachedData.metadata;
    }

    this.cleanCache(this.metadataCache);

    try {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).toLowerCase().replace('.', '');

      // 基本元信息
      const metadata: FileMetadata = {
        fileName,
        originalname: fileName,
        fileSize: stats.size,
        fileType,
        createdAt: stats.birthtime.getTime(),
        modifiedAt: stats.mtime.getTime(),
        accessedAt: stats.atime.getTime(),
        additionalInfo: {}
      };

      // 尝试获取MIME类型
      try {
        const fileTypeResult = await fileTypeFromFile(filePath);
        if (fileTypeResult) {
          metadata.mimeType = fileTypeResult.mime;
        }
      } catch (e) {
        // 忽略错误，继续处理
      }

      // 根据文件类型获取额外元信息
      switch (fileType) {
        case 'pdf':
          // PDF文件可以获取页数等信息，但需要额外库支持
          // 这里简化处理
          break;
        case 'docx':
        case 'doc':
          // Word文档可以获取作者、页数等信息
          // 这里简化处理
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
        case 'bmp':
        case 'tiff':
        case 'svg':
          try {
            // 获取图片尺寸信息
            const buffer = fs.readFileSync(filePath);
      const dimensions = imageSize(buffer);
            if (dimensions) {
              metadata.additionalInfo = metadata.additionalInfo ?? {};
              metadata.additionalInfo.width = dimensions.width;
              metadata.additionalInfo.height = dimensions.height;
              if (dimensions.type) {
                metadata.additionalInfo.format = dimensions.type;
              }
            }
          } catch (e) {
            // 忽略错误，继续处理
          }
          break;
        // 可以添加更多文件类型的元信息提取
      }

      this.metadataCache.set(filePath, {
        metadata,
        timestamp: Date.now()
      });
      return metadata;
    } catch (error) {
      throw new Error(`获取文件元信息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 解析文件内容
   * @param filePath 文件路径
   * @returns 解析后的文本内容和元信息
   */
  public async parseFile(filePath: string): Promise<string>;
  public async parseFile(filePath: string, includeMetadata: boolean): Promise<MessageFile>;
  public async parseFile(filePath: string, includeMetadata: boolean = false): Promise<string | MessageFile> {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    const stats = fs.statSync(filePath);
    const cachedContent = this.contentCache.get(filePath);
    if (cachedContent && stats.mtimeMs <= stats.mtimeMs) {
      if (includeMetadata) {
        const metadata = await this.getFileMetadata(filePath);
        return { content: cachedContent.content, metadata };
      }
      return cachedContent.content;
    }

    this.cleanCache(this.contentCache);

    const extension = path.extname(filePath).toLowerCase();
    let content = '';

    try {
      switch (extension) {
        case '.pdf':
          content = await this.parsePDF(filePath);
          break;
        case '.docx':
          content = await this.parseWord(filePath);
          break;
        case '.doc':
          content = await this.parseDoc(filePath);
          break;
        case '.xlsx':
        case '.xls':
          content = await this.parseExcel(filePath);
          break;
        case '.csv':
          content = await this.parseCSV(filePath);
          break;
        case '.html':
        case '.htm':
          content = await this.parseHTML(filePath);
          break;
        case '.xml':
          content = await this.parseXML(filePath);
          break;
        case '.pptx':
        case '.ppt':
          content = await this.parsePPT(filePath);
          break;
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.webp':
        case '.bmp':
        case '.tiff':
        case '.svg':
          content = await this.parseImage(filePath);
          break;
        case '.js':
        case '.ts':
        case '.tsx':
        case '.jsx':
        case '.css':
        case '.scss':
        case '.less':
        case '.json':
        case '.md':
        case '.txt':
          content = await this.parseTextFile(filePath);
          break;
        default:
          // 尝试作为文本文件解析
          try {
            content = await this.parseTextFile(filePath);
          } catch (e) {
            throw new Error('不支持的文件格式');
          }
      }

      const formattedContent = this.formatContent(content);
      
      this.contentCache.set(filePath, {
        content: formattedContent,
        timestamp: Date.now()
      });

      if (includeMetadata) {
        const metadata = await this.getFileMetadata(filePath);
        return {
          content: formattedContent,
          metadata,
          url: await this.imageToBase64Node(filePath)
        };
      }

      return formattedContent;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`解析文件失败: ${error.message}`);
      } else {
        throw error
      }
    }
  }


  async  imageToBase64Node(filePath: string) {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64String = fileBuffer.toString('base64');
      const mimeType = 'image/' + filePath.split('.').pop(); // 简单地根据文件扩展名获取 MIME 类型，可能不准确
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error('读取文件失败:', error);
      return ''
    }
  }

  /**
   * 上传文件
   */
  public async uploadFile(file: File): Promise<{ filePath: string; metadata: FileMetadata }> {
    try {
      // 创建临时目录
      const tempDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 生成唯一文件名
      const fileExt = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(tempDir, fileName);

      // 保存文件
      const buffer = await file.arrayBuffer();
      await fs.promises.writeFile(filePath, Buffer.from(buffer));

      // 获取文件元信息
      const metadata = await this.getFileMetadata(filePath);

      return { filePath, metadata };
    } catch (error) {
      throw new Error(`文件上传失败: ${(error as Error).message}`);
    }
  }

  /**
   * 解析PDF文件
   */
  private async parsePDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * 解析Word文件 (docx)
   */
  private async parseWord(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({path: filePath});
    return result.value;
  }

  /**
   * 解析Word文件 (doc)
   */
  private async parseDoc(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({path: filePath});
    return result.value;
  }

  /**
   * 解析Excel文件
   */
  private async parseExcel(filePath: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    let content: string[] = [];
    workbook.worksheets.forEach(worksheet => {
      content.push(`Sheet: ${worksheet.name}`);
      worksheet.eachRow((row, rowNumber) => {
        // 若果是  	values: CellValue[] | { [key: string]: CellValue };
        const values = row.values instanceof Array ? row.values : Object.values(row.values);
        content.push(
          values
            .slice(1)
            .map(cell => (cell ? cell.toString() : ''))
            .join('\t')
        );
      });
    });

    return content.join('\n');
  }

  /**
   * 解析CSV文件
   */
  private async parseCSV(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 优化缓冲区大小
      
      stream
        // @ts-ignore
        .pipe(csvParser({ maxRows: 10000 })) // 限制最大行数以防止内存溢出
        .on('data', (data) => {
          if (results.length < 10000) { // 额外的安全检查
            results.push(data);
          }
        })
        .on('end', () => {
          try {
            if (results.length === 0) {
              resolve('');
              return;
            }
            // 使用更高效的字符串拼接方法
            const headers = Object.keys(results[0]);
            const output = [headers.join('\t')];
            
            for (const row of results) {
              output.push(headers.map(header => row[header] || '').join('\t'));
            }
            
            resolve(output.join('\n'));
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          stream.destroy();
          reject(error);
        });
    });
  }

  /**
   * 解析HTML文件
   */
  private async parseHTML(filePath: string): Promise<string> {
    const html = await fs.promises.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    // 移除脚本和样式
    $('script, style').remove();
    // 获取文本内容
    return $('body').text().trim();
  }

  /**
   * 解析XML文件
   */
  private async parseXML(filePath: string): Promise<string> {
    const xml = await fs.promises.readFile(filePath, 'utf-8');
    const parser = new xml2js.Parser({explicitArray: false});
    const parseString = promisify(parser.parseString);
    // @ts-ignore
    const result = await parseString(xml);
    return JSON.stringify(result, null, 2);
  }

  /**
   * 解析PPT文件
   */
  private async parsePPT(filePath: string): Promise<string> {
    // 注意：完整解析PPT需要更复杂的库
    // 这里提供一个简化版本，实际项目中可能需要更专业的PPT解析库
    try {
      // 尝试作为文本文件读取，对于某些PPT可能不适用
      return `[PPT文件] ${path.basename(filePath)}\n该文件类型需要专用解析器`;
    } catch (error: any) {
      return `无法解析PPT文件: ${error.message}`;
    }
  }

  /**
   * 解析文本文件
   */
  private async parseTextFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * 解析图片文件
   */
  private async parseImage(filePath: string): Promise<string> {
    try {
      // 使用流式读取图片文件并并行处理
      const buffer = await fs.promises.readFile(filePath);
      const fileName = path.basename(filePath);
      const stats = fs.statSync(filePath);
      
      // 并行执行所有异步操作
      const [
        dimensions,
        fileTypeResult,
        exifData,
        dominantColor
      ] = await Promise.allSettled([
        imageSize(buffer),
        fileTypeFromFile(filePath),
        this.getExifData(buffer),
        this.extractDominantColor(filePath)
      ]);
      
      // 构建图片描述信息
      const imageInfo: string[] = [
        `[图片文件] ${fileName}`,
        // @ts-ignore
        `格式: ${fileTypeResult.status === 'fulfilled' ? fileTypeResult.value.ext.toUpperCase() : path.extname(filePath).slice(1).toUpperCase()}`,
        `尺寸: ${dimensions.status === 'fulfilled' ? `${dimensions.value.width || '未知'} x ${dimensions.value.height || '未知'}` : '未知'} 像素`,
        `大小: ${this.formatFileSize(stats.size)}`
      ];
      
      if (fileTypeResult.status === 'fulfilled') {
        // @ts-ignore
        imageInfo.push(`MIME类型: ${fileTypeResult.value.mime}`);
      }
      
      // 处理EXIF数据
      if (exifData.status === 'fulfilled' && exifData.value) {
        const tags = exifData.value.tags;
        if (tags) {
          imageInfo.push('', '[EXIF数据]');
          
          // 相机信息
          if (tags.Make || tags.Model) {
            imageInfo.push(`相机: ${[tags.Make, tags.Model].filter(Boolean).join(' ')}`);
          }
          
          // 拍摄参数
          const shootingInfo = [
            tags.FNumber && `光圈: f/${tags.FNumber}`,
            tags.ExposureTime && `曝光时间: ${tags.ExposureTime < 1 ? `1/${Math.round(1/tags.ExposureTime)}` : tags.ExposureTime}秒`,
            tags.ISO && `ISO: ${tags.ISO}`,
            tags.FocalLength && `焦距: ${tags.FocalLength}mm`
          ].filter(Boolean);
          
          if (shootingInfo.length > 0) {
            imageInfo.push(...shootingInfo);
          }
          
          // 拍摄时间
          if (tags.DateTimeOriginal) {
            const date = new Date(tags.DateTimeOriginal * 1000);
            imageInfo.push(`拍摄时间: ${date.toLocaleString()}`);
          }
          
          // GPS信息
          if (tags.GPSLatitude && tags.GPSLongitude) {
            imageInfo.push(`GPS坐标: ${tags.GPSLatitude.toFixed(6)}, ${tags.GPSLongitude.toFixed(6)}`);
          }
        }
      }
      
      // 处理颜色信息
      if (dominantColor.status === 'fulfilled' && dominantColor.value) {
        const [r, g, b] = dominantColor.value;
        imageInfo.push(
          '',
          '[颜色分析]',
          `主色调: RGB(${r}, ${g}, ${b})`,
          `十六进制: #${this.rgbToHex(r, g, b)}`
        );
      }
      
      return imageInfo.join('\n');
    } catch (error) {
      return `无法解析图片文件: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }

  private async getExifData(buffer: Buffer) {
    try {
      const parser = exifParser.create(buffer);
      return parser.parse();
    } catch (error: any) {
      return `无法解析图片文件: ${error.message}`;
    }
  }
  
  /**
   * 提取图片的主要颜色
   * 如有其他图像处理需求（如模糊识别、色系分析），也可以结合 sharp 或 jimp 等图像库增强功能。
   */
  private async extractDominantColor(filePath: string): Promise<number[] | null> {
    try {
      const colorThief = new ColorThief();
      // 使用 getPalette 获取主色（默认取第一个颜色）
      const palette = await colorThief.getPalette(filePath, 1);
      return palette ? palette[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 将RGB值转换为十六进制颜色代码
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('');
  }
  
  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  /**
   * 格式化内容，确保输出适合大模型对话
   */
  private formatContent(content: string): string {
    // 移除多余的空白字符，但保留段落结构
    content = content.replace(/[\t ]+/g, ' ');
    content = content.replace(/\n{3,}/g, '\n\n');

    // 移除特殊字符
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // 限制内容长度
    const maxLength = 100000; // 根据实际需求调整
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...(内容已截断)';
    }
    return content.trim();
  }
}
