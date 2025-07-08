import { ResultHelper } from "./routeHelper.ts";
import { Body, Controller, Post, Upload } from "../decorators/decorators.ts";
import multer from "@koa/multer";
import { DocumentService } from "../services/DocumentService.ts";
import { FileParserService } from "../services/FileParserService.ts";

/**
 * 文件解析器控制器 - 简化版本
 * 主要负责基本的文件解析和上传功能
 * 知识库相关功能已迁移到 KnowledgeController
 */
@Controller('/invoke/fileParser')
export class DcoumentController {
  private fileParserService: FileParserService;
  private documentService: DocumentService;

  constructor() {
    this.fileParserService = FileParserService.getInstance();
    this.documentService = new DocumentService();
  }

  /**
   * 解析单个文件
   */
  @Post('/parse')
  async parseFile(@Body() body: { filePath: string }) {
    try {
      const content = await this.fileParserService.parseFile(body.filePath);
      return ResultHelper.success(content);
    } catch (error) {
      return ResultHelper.fail((error as Error).message, null);
    }
  }

  /**
   * 上传并解析单个文件
   */
  @Post('/upload')
  @Upload('file')
  async uploadFile(@Body() body: { file: multer.File }) {
    try {
      const result = await this.fileParserService.parseFile(body.file.path, true);
      result.metadata.originalname = body.file.originalname;
      return ResultHelper.success(result);
    } catch (error) {
      return ResultHelper.fail((error as Error).message, null);
    }
  }

  /**
   * 批量上传文件（仅创建文档对象，不进行知识库处理）
   * @deprecated 建议使用 KnowledgeController 的上传功能
   */
  @Post('/upload/documents')
  @Upload('files', { multiple: true })
  async uploadDocuments(@Body('files') files: Array<multer.File>) {
    try {
      const documents = await this.documentService.uploadDocuments(files);
      return ResultHelper.success(documents);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}
