import fs from 'fs';
import path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import cheerio from 'cheerio';
import xml2js from 'xml2js';
import mammoth from 'mammoth';
import { fileTypeFromFile } from 'file-type';
import { Readable } from 'stream';
import { promisify } from 'util';

/**
 * 文件元信息接口
 */
export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  mimeType?: string;
  author?: string;
  pageCount?: number;
  wordCount?: number;
  additionalInfo?: Record<string, any>;
}

/**
 * 文件解析结果接口
 */
export interface FileParseResult {
  content: string;
  metadata: FileMetadata;
}

export class FileParserService {
  private static instance: FileParserService;

  private constructor() {}

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
        fileSize: stats.size,
        fileType,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
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
        // 可以添加更多文件类型的元信息提取
      }

      return metadata;
    } catch (error) {
      throw new Error(`获取文件元信息失败: ${error.message}`);
    }
  }

  /**
   * 解析文件内容
   * @param filePath 文件路径
   * @returns 解析后的文本内容和元信息
   */
  public async parseFile(filePath: string): Promise<string>;
  public async parseFile(filePath: string, includeMetadata: boolean): Promise<FileParseResult>;
  public async parseFile(filePath: string, includeMetadata: boolean = false): Promise<string | FileParseResult> {
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
      throw new Error(`解析文件失败: ${error.message}`);
    }
  }

  /**
   * 解析PDF文件
   */
  private async parsePDF(filePath: string): Promise<string> {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n');
  }

  /**
   * 解析Word文件 (docx)
   */
  private async parseWord(filePath: string): Promise<string> {
    const loader = new DocxLoader(filePath);
    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n');
  }
  
  /**
   * 解析Word文件 (doc)
   */
  private async parseDoc(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * 解析Excel文件
   */
  private async parseExcel(filePath: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    let content = [];
    workbook.worksheets.forEach(worksheet => {
      content.push(`Sheet: ${worksheet.name}`);
      worksheet.eachRow((row, rowNumber) => {
        content.push(
          row.values
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
    const parser = new xml2js.Parser({ explicitArray: false });
    const parseString = promisify(parser.parseString);
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
    } catch (error) {
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