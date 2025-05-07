import { Controller, Post, Body } from '@/decorators';
import { FileParserService } from '../services/FileParserService';
import { ResultHelper } from '../utils/ResultHelper';

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
      return ResultHelper.fail(error.message, null);
    }
  }
}