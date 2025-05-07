import fs from 'fs';
import path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import ExcelJS from 'exceljs';

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
   * 解析文件内容
   * @param filePath 文件路径
   * @returns 解析后的文本内容
   */
  public async parseFile(filePath: string): Promise<string> {
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
        case '.xlsx':
        case '.xls':
          content = await this.parseExcel(filePath);
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
          throw new Error('不支持的文件格式');
      }

      return this.formatContent(content);
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
   * 解析Word文件
   */
  private async parseWord(filePath: string): Promise<string> {
    const loader = new DocxLoader(filePath);
    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n');
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
   * 解析文本文件
   */
  private async parseTextFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * 格式化内容，确保输出适合大模型对话
   */
  private formatContent(content: string): string {
    // 移除多余的空白字符
    content = content.replace(/\s+/g, ' ');
    // 移除特殊字符
    content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // 限制内容长度
    const maxLength = 100000; // 根据实际需求调整
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...(内容已截断)';
    }
    return content.trim();
  }
}