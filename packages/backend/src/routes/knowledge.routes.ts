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
import {KnowledgeBase} from "../../../../share/knowledge.ts";



interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

interface ChatRequest {
  query: string;
}

@Controller('/invoke/knowledge-bases')
export class KnowledgeController {

  private knowledgeService: KnowledgeService;

  constructor() {

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

  @Post('/saveKnowledgeBases')
  async saveKnowledgeBases(@Body() request: Partial<KnowledgeBase>[]) {
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