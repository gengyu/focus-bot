import {FileParserService} from '../services/FileParserService';

import {ResultHelper} from "../routes/routeHelper.ts";
import {Body, Controller, Post, Upload} from "../decorators/decorators.ts";
import {type} from "node:os";
import iconv  from  'iconv-lite'; // 需要安装 iconv-lite
import multer  from "@koa/multer";

@Controller('/invoke/fileParser')
export class FileParserController {
  private fileParserService: FileParserService;

  constructor() {
    this.fileParserService = FileParserService.getInstance();
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
}
