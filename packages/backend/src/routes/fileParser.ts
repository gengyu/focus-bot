import {FileParserService} from '../services/FileParserService';

import {ResultHelper} from "../routes/routeHelper.ts";
import {Body, Controller, Post, Upload} from "../decorators/decorators.ts";
import {type} from "node:os";
import iconv  from  'iconv-lite'; // 需要安装 iconv-lite

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
  async uploadFile(@Body() body: any) {
    try {
      const originalName = body.file.originalname;
      // 尝试使用不同的编码解码，然后重新编码为 UTF-8
      const decodedName = iconv.decode(Buffer.from(originalName, 'latin1'), 'utf8');
      // 或者尝试其他编码，例如 'gb2312'
      // const decodedName = iconv.decode(Buffer.from(originalName, 'latin1'), 'gb2312');
      const encodedName = iconv.encode(decodedName, 'utf8').toString();

      // 文件信息会被multer中间件处理并添加到request.body.file中
      const file = body.file;
      console.log(body,555)
      // const result = await this.fileParserService.uploadFile(file);
      return ResultHelper.success({...body, encodedName, decodedName});
    } catch (error) {
      return ResultHelper.fail((error as Error).message, null);
    }
  }
}