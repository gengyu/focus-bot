import {Body, Controller, Delete, Get, Post, Upload} from '../decorators/decorators';
import {ResultHelper} from './routeHelper';
// import { RAGService } from '../services/rag.service';
import {OpenAIProvider} from '../provider/OpenAIProvider';
import {ProviderConfig} from '../../../../share/type';
import multer from '@koa/multer';
import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {KnowledgeService} from "../services/knowledge.service.ts";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  documents: Array<{
    id: string;
    name: string;
    path: string;
  }>;
}

interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

interface ChatRequest {
  query: string;
}

@Controller('/invoke/knowledge-bases')
export class KnowledgeController {

  private knowledgeBases: Map<string, KnowledgeBase>;
  private knowledgeService: KnowledgeService;

  constructor() {

    this.knowledgeBases = new Map<string, KnowledgeBase>();
    this.knowledgeService = new KnowledgeService();
  }

  @Post('/getKnowledgeBases')
  async getKnowledgeBases() {
    try {
      const knowledgeBases = await this.knowledgeService.getKnowledgeBases();
      return ResultHelper.success(knowledgeBases);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/createKnowledgeBase')
  async createKnowledgeBase(@Body() request: CreateKnowledgeBaseRequest) {
    try {
      const {name, description} = request;

      const id = uuidv4();
      const knowledgeBase: KnowledgeBase = {
        id,
        name,
        description: description || '',
        documentCount: 0,
        createdAt: new Date().toISOString(),
        documents: []
      };

      await this.knowledgeService.createKnowledgeBase(knowledgeBase)

      return ResultHelper.success(knowledgeBase);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Delete('/:id')
  async deleteKnowledgeBase(@Body('id') id: string) {
    try {
      const kb = this.knowledgeBases.get(id);
      if (!kb) {
        return ResultHelper.fail('知识库不存在', null);
      }

      // 删除相关文件
      for (const doc of kb.documents) {
        try {
          await fs.unlink(doc.path);
        } catch (error) {
          console.error('删除文件失败:', error);
        }
      }

      // 删除知识库索引和文档
      // await this.ragService.deleteKnowledgeBase(id);
      this.knowledgeBases.delete(id);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }


  @Post('/upload/documents')
  @Upload('files', {multiple: true})
  async uploadDocuments(
    @Body('id') id: string,
    @Body('files') files: Array<multer.File>,
    @Body() filename: string
  ) {
    try {


      await this.knowledgeService.uploadDocuments(id, files);
      return ResultHelper.success({message: '文档上传成功'});
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/searchDocuments')
   async searchDocuments(@Body('id') id: string, @Body('query') query: string) {
    try {
      if (!query) {
        return ResultHelper.fail('搜索关键词不能为空', null);
      }

      const results = await this.knowledgeService.retrieveRelevantDocs(id, query);
      return ResultHelper.success(results);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
}