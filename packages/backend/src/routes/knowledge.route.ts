import { ResultHelper } from "./routeHelper.ts";
import { Body, Controller, Post, Upload, Get } from "../decorators/decorators.ts";
import multer from "@koa/multer";
import { DocumentService } from "../services/DocumentService.ts";
import { EnhancedKnowledgeService } from "../services/knowledge/enhanced-knowledge.service.ts";
import { FileParserService } from "../services/FileParserService.ts";
import { KnowledgeDocument } from "../../../../share/knowledge.ts";
import { ChunkingOptions } from "../services/FileParserService.ts";
import { SearchOptions } from "../services/knowledge/types.ts";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * 知识库控制器
 * 提供知识库的创建、文档上传、搜索等功能
 */
@Controller('/invoke/api/knowledge')
export class KnowledgeController {
  private knowledgeService: EnhancedKnowledgeService;
  private documentService: DocumentService;
  private fileParserService: FileParserService;

  constructor() {
    this.knowledgeService = new EnhancedKnowledgeService();
    this.documentService = new DocumentService();
    this.fileParserService = FileParserService.getInstance();
  }

  /**
   * 创建知识库
   */
  @Post('/create')
  async createKnowledgeBase(
    @Body('name') name: string,
    @Body('description') description?: string
  ) {
    try {
      if (!name) {
        return ResultHelper.fail('知识库名称不能为空', null);
      }

      const namespaceId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.knowledgeService.createKnowledgeBase(namespaceId, name, description || '');
      
      return ResultHelper.success({
        id: namespaceId,
        name,
        description: description || '',
        documentCount: 0,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      return ResultHelper.fail(`创建知识库失败: ${error instanceof Error ? error.message : '未知错误'}`, null);
    }
  }

  /**
   * 获取所有知识库列表
   */
  @Get('/list')
  async getKnowledgeBases() {
    try {
      const knowledgeBases = await this.knowledgeService.getAllKnowledgeBases();
      const result = knowledgeBases.map(kb => {
        const stats = this.knowledgeService.getKnowledgeBaseStats(kb.id);
        return {
          id: kb.id,
          name: kb.name,
          description: kb.description,
          documentCount: kb.documentCount,
          chunkCount: stats.chunkCount,
          createdAt: kb.createdAt,
          config: stats.config
        };
      });
      
      return ResultHelper.success(result);
    } catch (error) {
      return ResultHelper.fail(`获取知识库列表失败: ${error instanceof Error ? error.message : '未知错误'}`, null);
    }
  }

  /**
   * 获取知识库详情
   */
  @Post('/detail')
  async getKnowledgeBaseDetail(@Body('id') namespaceId: string) {
    try {
      if (!namespaceId) {
        return ResultHelper.fail('知识库ID不能为空', null);
      }

      const stats = this.knowledgeService.getKnowledgeBaseStats(namespaceId);
      const documents = this.knowledgeService.getDocuments(namespaceId);
      
      return ResultHelper.success({
        id: namespaceId,
        stats,
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          chunks: doc.chunks?.length || 0,
          addedAt: doc.metadata.addedAt,
          lastModified: doc.metadata.lastModified
        }))
      });
    } catch (error) {
      return ResultHelper.fail(`获取知识库详情失败: ${(error as Error).message}`, null);
    }
  }

  /**
   * 上传文档到知识库
   */
  @Post('/upload')
  @Upload('files', { multiple: true })
  async uploadDocuments(
    @Body('files') files: Array<multer.File>,
    @Body('namespaceId') namespaceId: string,
    @Body('chunkSize') chunkSize?: number,
    @Body('chunkOverlap') chunkOverlap?: number
  ) {
    try {
      if (!namespaceId) {
        return ResultHelper.fail('知识库ID不能为空', null);
      }

      if (!files || files.length === 0) {
        return ResultHelper.fail('请选择要上传的文件', null);
      }

      // 确保知识库存在
      const knowledgeBases =await this.knowledgeService.getAllKnowledgeBases();
      if (!knowledgeBases.some(kb => kb.id === namespaceId)) {
        return ResultHelper.fail('知识库不存在', null);
      }

      // 分块选项
      const chunkingOptions: ChunkingOptions = {
        chunkSize: chunkSize || 1000,
        chunkOverlap: chunkOverlap || 200
      };

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const file of files) {
        try {
          // 创建知识文档对象
          const document: KnowledgeDocument = {
            id: uuidv4(),
            name: file.originalname,
            path: file.path,
            type: path.extname(file.originalname).toLowerCase().replace('.', ''),
            size: file.size,
            createdAt: new Date().toISOString(),
            // metadata: {
            //   originalName: file.originalname,
            //   mimeType: file.mimetype,
            //   uploadedAt: new Date().toISOString()
            // }
          };

          // 添加到知识库
          const result = await this.knowledgeService.addDocument(
            namespaceId,
            document,
            chunkingOptions
          );

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }

          results.push({
            fileName: file.originalname,
            documentId: document.id,
            success: result.success,
            chunksCreated: result.chunksCreated || 0,
            error: result.error,
            message: result.message
          });
        } catch (error) {
          failureCount++;
          results.push({
            fileName: file.originalname,
            success: false,
            error: (error as Error).message
          });
        }
      }

      return ResultHelper.success({
        totalFiles: files.length,
        successCount,
        failureCount,
        results
      });
    } catch (error) {
      return ResultHelper.fail(`上传文档失败: ${(error as Error).message}`, null);
    }
  }

  /**
   * 在知识库中搜索
   */
  @Post('/search')
  async searchInKnowledgeBase(
    @Body('namespaceId') namespaceId: string,
    @Body('query') query: string,
    @Body('topK') topK?: number,
    @Body('similarityThreshold') similarityThreshold?: number,
    @Body('includeMetadata') includeMetadata?: boolean,
    @Body('highlightMatches') highlightMatches?: boolean
  ) {
    try {
      if (!namespaceId) {
        return ResultHelper.fail('知识库ID不能为空', null);
      }

      if (!query || query.trim().length === 0) {
        return ResultHelper.fail('搜索关键词不能为空', null);
      }

      // 确保知识库存在
      const knowledgeBases =  await this.knowledgeService.getAllKnowledgeBases();
      if (!knowledgeBases.some(kb => kb.id === namespaceId)) {
        return ResultHelper.fail('知识库不存在', null);
      }

      // 搜索选项
      const searchOptions: SearchOptions = {
        topK: topK || 5,
        similarityThreshold: similarityThreshold || 0.3,
        includeMetadata: includeMetadata !== false,
        highlightMatches: highlightMatches !== false
      };

      // 执行搜索
      const searchResults = await this.knowledgeService.searchDocuments(
        namespaceId,
        query,
        searchOptions
      );

      // 格式化结果
      const formattedResults = this.knowledgeService.formatRetrievalResults(searchResults);

      return ResultHelper.success({
        query,
        totalResults: formattedResults.length,
        results: formattedResults,
        searchOptions
      });
    } catch (error) {
      return ResultHelper.fail(`搜索失败: ${(error as Error).message}`, null);
    }
  }

  /**
   * 删除知识库中的文档
   */
  @Post('/document/delete')
  async deleteDocument(
    @Body('namespaceId') namespaceId: string,
    @Body('documentId') documentId: string
  ) {
    try {
      if (!namespaceId || !documentId) {
        return ResultHelper.fail('知识库ID和文档ID不能为空', null);
      }

      const success = await this.knowledgeService.removeDocument(namespaceId, documentId);
      
      if (success) {
        return ResultHelper.success({ message: '文档删除成功' });
      } else {
        return ResultHelper.fail('文档删除失败', null);
      }
    } catch (error) {
      return ResultHelper.fail(`删除文档失败: ${(error as Error).message}`, null);
    }
  }

  /**
   * 删除知识库
   */
  @Post('/delete')
  async deleteKnowledgeBase(@Body('id') namespaceId: string) {
    try {
      if (!namespaceId) {
        return ResultHelper.fail('知识库ID不能为空', null);
      }

      const success = await this.knowledgeService.deleteKnowledgeBase(namespaceId);
      
      if (success) {
        return ResultHelper.success({ message: '知识库删除成功' });
      } else {
        return ResultHelper.fail('知识库删除失败', null);
      }
    } catch (error) {
      return ResultHelper.fail(`删除知识库失败: ${(error as Error).message}`, null);
    }
  }

  /**
   * 更新知识库配置
   */
  @Post('/config/update')
  async updateKnowledgeBaseConfig(
    @Body('id') namespaceId: string,
    @Body('config') config: any
  ) {
    try {
      if (!namespaceId) {
        return ResultHelper.fail('知识库ID不能为空', null);
      }

      const success = this.knowledgeService.updateKnowledgeBaseConfig(namespaceId, config);
      
      if (success) {
        const updatedStats = this.knowledgeService.getKnowledgeBaseStats(namespaceId);
        return ResultHelper.success({
          message: '配置更新成功',
          config: updatedStats.config
        });
      } else {
        return ResultHelper.fail('知识库不存在或配置更新失败', null);
      }
    } catch (error) {
      return ResultHelper.fail(`更新配置失败: ${(error as Error).message}`, null);
    }
  }
}