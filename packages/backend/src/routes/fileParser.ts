import {FileParserService} from '../services/FileParserService';

import {ResultHelper} from "../routes/routeHelper.ts";
import {Body, Controller, Post} from "../decorators/decorators.ts";

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
}