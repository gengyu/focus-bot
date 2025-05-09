import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import pdfParse from 'pdf-parse';
import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import cheerio from 'cheerio';
import xml2js from 'xml2js';
import mammoth from 'mammoth';
import {fileTypeFromFile} from 'file-type';
import {Readable} from 'stream';
import {promisify} from 'util';
import imageSize from 'image-size';
import exifParser from 'exif-parser';
import { getColorFromURL } from 'color-thief-node';
import {FileMetadata, MessageFile} from "../../../../share/type.ts";


export class FileParserService {
  private static instance: FileParserService;

  private constructor() {
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
  public async getFileMetadata(filePath: string): Promise<FileMetadata> {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

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
            const dimensions = imageSize(filePath);
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

      if (includeMetadata) {
        const metadata = await this.getFileMetadata(filePath);
        return {
          content: formattedContent,
          metadata
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
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            // 将CSV数据转换为字符串
            const headers = Object.keys(results[0] || {});
            const rows = results.map(row => {
              return headers.map(header => row[header]).join('\t');
            });
            resolve([headers.join('\t'), ...rows].join('\n'));
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error));
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
      // 获取图片元数据
      const dimensions = imageSize(filePath);
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).toLowerCase().replace('.', '');
      const stats = fs.statSync(filePath);
      
      // 构建图片描述信息
      let imageInfo = `[图片文件] ${fileName}\n`;
      imageInfo += `格式: ${fileType.toUpperCase()}\n`;
      imageInfo += `尺寸: ${dimensions.width || '未知'} x ${dimensions.height || '未知'} 像素\n`;
      imageInfo += `大小: ${this.formatFileSize(stats.size)}\n`;
      
      // 尝试获取更多图片信息
      try {
        const fileTypeResult = await fileTypeFromFile(filePath);
        if (fileTypeResult) {
          imageInfo += `MIME类型: ${fileTypeResult.mime}\n`;
        }
      } catch (e) {
        // 忽略错误
      }
      
      // 提取EXIF数据（仅适用于JPEG和某些TIFF图像）
      if (['jpg', 'jpeg', 'tiff'].includes(fileType.toLowerCase())) {
        try {
          const buffer = fs.readFileSync(filePath);
          const parser = exifParser.create(buffer);
          const exifData = parser.parse();
          
          if (exifData && exifData.tags) {
            imageInfo += `\n[EXIF数据]\n`;
            
            // 相机信息
            if (exifData.tags.Make || exifData.tags.Model) {
              imageInfo += `相机: ${exifData.tags.Make || ''} ${exifData.tags.Model || ''}`.trim() + '\n';
            }
            
            // 拍摄参数
            if (exifData.tags.FNumber) {
              imageInfo += `光圈: f/${exifData.tags.FNumber}\n`;
            }
            
            if (exifData.tags.ExposureTime) {
              const exposureTime = exifData.tags.ExposureTime;
              imageInfo += `曝光时间: ${exposureTime < 1 ? `1/${Math.round(1/exposureTime)}` : exposureTime}秒\n`;
            }
            
            if (exifData.tags.ISO) {
              imageInfo += `ISO: ${exifData.tags.ISO}\n`;
            }
            
            if (exifData.tags.FocalLength) {
              imageInfo += `焦距: ${exifData.tags.FocalLength}mm\n`;
            }
            
            // 拍摄时间
            if (exifData.tags.DateTimeOriginal) {
              const date = new Date(exifData.tags.DateTimeOriginal * 1000);
              imageInfo += `拍摄时间: ${date.toLocaleString()}\n`;
            }
            
            // GPS信息
            if (exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) {
              imageInfo += `GPS坐标: ${exifData.tags.GPSLatitude.toFixed(6)}, ${exifData.tags.GPSLongitude.toFixed(6)}\n`;
            }
          }
        } catch (e) {
          // 忽略EXIF解析错误
        }
      }
      
      // 提取颜色信息
      try {
        // 分析图片主要颜色
        const dominantColor = await this.extractDominantColor(filePath);
        if (dominantColor) {
          imageInfo += `\n[颜色分析]\n`;
          imageInfo += `主色调: RGB(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})\n`;
          imageInfo += `十六进制: #${this.rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2])}\n`;
        }
      } catch (e) {
        // 忽略颜色分析错误
      }
      
      return imageInfo;
    } catch (error: any) {
      return `无法解析图片文件: ${error.message}`;
    }
  }
  
  /**
   * 提取图片的主要颜色
   */
  private async extractDominantColor(filePath: string): Promise<number[] | null> {
    try {
      // 使用color-thief-node提取主要颜色
      const dominantColor = await getColorFromURL(filePath);
      return dominantColor;
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
