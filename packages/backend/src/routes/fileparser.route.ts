import {FileParserService} from '../services/FileParserService';

import {ResultHelper} from "../routes/routeHelper.ts";
import {Body, Controller, Post, Upload} from "../decorators/decorators.ts";
import multer from "@koa/multer";
import {DocumentService} from "../services/DocumentService.ts";
import {KnowledgeDocument} from "../../../../share/knowledge.ts";

@Controller('/invoke/fileParser')
export class DcoumentController {
  private fileParserService: FileParserService;
  private documentService: DocumentService;

  constructor() {
    this.fileParserService = FileParserService.getInstance();
    this.documentService = new DocumentService();
  }

  @Post('/parse')
  async parseFile(@Body() body: { filePath: string }) {
    try {
      const content = await this.fileParserService.parseFile(body.filePath);
      return ResultHelper.success(content);
    } catch (error) {
      return ResultHelper.fail((error as Error).message, null);
    }
  }




  @Post('/upload')
  @Upload('file')
  async uploadFile(@Body() body: { file: multer.File }) {
    try {
      const result = await this.fileParserService.parseFile(body.file.path,  true);
      result.metadata.originalname = body.file.originalname;
      // result.metadata.createdAt =
      return ResultHelper.success(result);
    } catch (error) {
      return ResultHelper.fail((error as Error).message, null);
    }
  }

  @Post('/upload/documents')
  @Upload('files', {multiple: true})
  async uploadDocuments(@Body('files') files: Array<multer.File>,) {
    try {
      const documents = await this.documentService.uploadDocuments( files);
      return ResultHelper.success(documents);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }


  @Post('/searchDocuments')
  async searchDocuments(@Body('query') query: string, @Body('documents') documents: KnowledgeDocument[]) {
    try {
      if (!query) {
        return ResultHelper.fail('搜索关键词不能为空', null);
      }

      const results = await this.documentService.retrieveRelevantDocs(query, documents);
      return ResultHelper.success(results);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}
