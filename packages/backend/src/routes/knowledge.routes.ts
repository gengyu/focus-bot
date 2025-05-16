import {Body, Controller, Delete, Get, Post, Upload} from '../decorators/decorators';
import { ResultHelper } from './routeHelper';
import { RAGService } from '../services/rag.service';
import { OpenAIProvider } from '../provider/OpenAIProvider';
import { ProviderConfig } from '../../../../share/type';
import multer from '@koa/multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

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
  private ragService: RAGService;
  private knowledgeBases: Map<string, KnowledgeBase>;
  private upload: multer.Multer;

  constructor() {
    // 创建 LLM Provider
    const providerConfig: ProviderConfig = {
      id: 'openai',
      name: 'OpenAI',
      enabled: true,
      apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      models: [],
      temperature: 0.7,
      maxTokens: 2000,
    };

    const llmProvider = new OpenAIProvider(providerConfig);
    this.ragService = new RAGService(llmProvider);
    this.knowledgeBases = new Map<string, KnowledgeBase>();
    this.upload = multer({ dest: 'uploads/' });
  }

  @Post('/getKnowledgeBases')
  async getKnowledgeBases() {
    try {
      return ResultHelper.success(Array.from(this.knowledgeBases.values()));
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/createKnowledgeBase')
  async createKnowledgeBase(@Body() request: CreateKnowledgeBaseRequest) {
    try {
      const { name, description } = request;
      
      if (!name) {
        return ResultHelper.fail('知识库名称不能为空', null);
      }

      const id = uuidv4();
      const knowledgeBase: KnowledgeBase = {
        id,
        name,
        description: description || '',
        documentCount: 0,
        createdAt: new Date().toISOString(),
        documents: []
      };

      this.knowledgeBases.set(id, knowledgeBase);
      await this.ragService.prepareKnowledgeBase(id,[])
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
      await this.ragService.deleteKnowledgeBase(id);
      this.knowledgeBases.delete(id);
      return ResultHelper.success(null);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }


  @Post('/upload/documents')
  @Upload('files', { multiple: true})
  async uploadDocuments(
    @Body('id') id: string,
    @Body('files') files: Array< multer.File >
  ) {
    try {
      const kb = this.knowledgeBases.get(id);
      if (!kb) {
        return ResultHelper.fail('知识库不存在', null);
      }

      if (!files || files.length === 0) {
        return ResultHelper.fail('没有上传文件', null);
      }

      // 处理上传的文件
      for (const file of files) {
        const docId = uuidv4();
        const docName = file.originalname;
        const docPath = file.path;

        kb.documents.push({
          id: docId,
          name: docName,
          path: docPath
        });
      }

      kb.documentCount = kb.documents.length;
      this.knowledgeBases.set(id, kb);

      // 准备知识库
      const documents = await Promise.all(
        kb.documents.map(async doc => ({
          pageContent: await fs.readFile(doc.path, 'utf-8'),
          metadata: {
            id: doc.id,
            source: doc.name
          }
        }))
      );

      await this.ragService.prepareKnowledgeBase(id, documents);
      return ResultHelper.success({ message: '文档上传成功' });
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }

  @Post('/:id/chat')
  async chat(@Body('id') id: string, @Body('query') query: string) {
    try {
      if (!query) {
        return ResultHelper.fail('查询不能为空', null);
      }

      const kb = this.knowledgeBases.get(id);
      if (!kb) {
        return ResultHelper.fail('知识库不存在', null);
      }

      // 加载知识库
      await this.ragService.loadKnowledgeBase(id);
      
      // 执行 RAG 查询
      const result = await this.ragService.ragPipeline(query);
      return ResultHelper.success(result);
    } catch (err: any) {
      return ResultHelper.fail(err.message, null);
    }
  }
} 