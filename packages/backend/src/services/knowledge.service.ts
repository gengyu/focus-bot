import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import {Document} from '../types/rag.types';
import {PersistenceService} from './PersistenceService';
import {SearchService} from './SearchService';
import {FileParserService} from "./FileParserService.ts";
import {Singleton} from "../decorators/Singleton.ts";
import {KnowledgeBase} from "../../../../share/knowledge.ts";
import multer from "@koa/multer";
import {
  vectorizeAndStore,
  getVectors,
  VectorDocument,
  searchSimilarDocuments,
  VectorizationOptions,
  VectorizationResult,
} from './knowledge/vectorizationService';


// 示例使用


export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface RelevantDoc {
  content: string;
  score: number;
}

@Singleton()
export class KnowledgeService {
  private knowledgeBases: Map<string, KnowledgeBase>;
  private documents: Map<string, Document[]> = new Map();

  private readonly searchService: SearchService;
  private readonly persistenceService: PersistenceService<Record<string, KnowledgeBase>>;
  private fileParserService: FileParserService;

  constructor() {
    this.knowledgeBases = new Map<string, KnowledgeBase>();
    this.searchService = new SearchService();

    // 初始化持久化服务
    this.persistenceService = new PersistenceService({
      configFileName: 'knowledge-bases.json',
      backupInterval: 3600000, // 1小时备份一次
      maxBackups: 24 // 保留24个备份
    });

    this.fileParserService = FileParserService.getInstance();

    // 加载数据
    this.initialize();
  }

  /**
   * 初始化服务
   * 从持久化存储中加载知识库数据，并初始化索引和文档
   */
  private async initialize() {
    // 加载持久化的知识库数据
    const data = await this.persistenceService.loadData();
    if (data) {
      this.knowledgeBases = new Map(Object.entries(data));

      // 初始化每个知识库的索引和文档
      for (const [id, kb] of this.knowledgeBases) {
        try {
          // 读取所有文档内容
          const documents = await Promise.all(
            kb.documents.map(async doc => ({
              pageContent: await this.fileParserService.parseFile(doc.path),
              metadata: {
                id: doc.id,
                source: doc.name
              }
            }))
          );

          // 准备知识库索引
          await this.prepareKnowledgeBase(id, documents);
        } catch (error) {
          console.error(`初始化知识库 ${kb.name} 失败:`, error);
        }
      }
    }
  }

  /**
   * 准备知识库索引的主方法
   * 执行完整流程：文档分块 -> 创建并填充 FlexSearch 索引
   * @param knowledgeBaseId 知识库ID
   * @param documents 需要处理的原始文档数组
   */
  private async prepareKnowledgeBase(knowledgeBaseId: string, documents: Document[]) {
    this.documents.set(knowledgeBaseId, documents);

    // 向量化文档内容
    const texts = documents.map(doc => doc.pageContent);
    // await vectorizeAndStore({
    //   knowledgeBaseId,
    //   texts
    // });
  }

  /**
   * 保存知识库数据
   * 将当前内存中的知识库数据持久化存储
   */
  private async saveKnowledgeBases() {
    const data = Object.fromEntries(this.knowledgeBases);
    await this.persistenceService.saveData(data);
  }

  /**
   * 获取所有知识库
   * @returns 包含所有知识库信息的数组
   */
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBases.values());
  }

  /**
   * 创建新的知识库
   * @param request 包含创建知识库所需参数的对象
   * @returns 创建成功的知识库对象
   */
  async createKnowledgeBase(request: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const { name, description } = request;

    if (!name) {
      throw new Error('知识库名称不能为空');
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
    await this.saveKnowledgeBases();
    return knowledgeBase;
  }

  /**
   * 获取单个知识库的详细信息
   * @param id 知识库ID
   * @returns 知识库对象
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    const kb = this.knowledgeBases.get(id);
    if (!kb) {
      throw new Error('知识库不存在');
    }
    return kb;
  }

  /**
   * 删除指定的知识库
   * @param id 知识库ID
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    const kb = this.knowledgeBases.get(id);
    if (!kb) {
      throw new Error('知识库不存在');
    }

    // 删除相关文件
    for (const doc of kb.documents) {
      try {
        await fs.unlink(doc.path);
      } catch (error) {
        console.error('删除文件失败:', error);
      }
    }

    // 删除知识库和文档
    this.documents.delete(id);
    this.knowledgeBases.delete(id);
    // 持久化更新后的知识库数据
    await this.saveKnowledgeBases();
  }

  /**
   * 上传文档到指定知识库
   * @param id 知识库ID
   * @param files 需要上传的文件数组
   */
  async uploadDocuments(id: string, files: Array<multer.File>): Promise<void> {
    const kb = this.knowledgeBases.get(id);
    if (!kb) {
      throw new Error('知识库不存在');
    }

    if (!files || files.length === 0) {
      throw new Error('没有上传文件');
    }

    // 处理上传的文件
    for (const file of files) {
      const docId = uuidv4();
      const docName = file.originalname;
      const path = file.path;

      kb.documents.push({
        id: docId,
        name: docName,
        path,
        size: file.size,
        createdAt: new Date().toISOString(),
        type: file.mimetype,
      });
    }

    kb.documentCount = kb.documents.length;
    this.knowledgeBases.set(id, kb);
    // 持久化更新后的知识库数据
    await this.saveKnowledgeBases();

    // 准备知识库
    const documents = await Promise.all(
      kb.documents.map(async doc => ({
        pageContent: await this.fileParserService.parseFile(doc.path),
        metadata: {
          id: doc.id,
          source: doc.name
        }
      }))
    );

    await this.prepareKnowledgeBase(id, documents);
  }

  /**
   * 从知识库中删除指定文档
   * @param knowledgeBaseId 知识库ID
   * @param documentId 文档ID
   */
  async deleteDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
    const kb = this.knowledgeBases.get(knowledgeBaseId);
    if (!kb) {
      throw new Error('知识库不存在');
    }

    const docIndex = kb.documents.findIndex(doc => doc.id === documentId);
    if (docIndex === -1) {
      throw new Error('文档不存在');
    }

    const doc = kb.documents[docIndex];

    // 删除文件
    try {
      await fs.unlink(doc.path);
    } catch (error) {
      console.error('删除文件失败:', error);
    }

    // 从知识库中移除文档
    kb.documents.splice(docIndex, 1);
    kb.documentCount = kb.documents.length;
    this.knowledgeBases.set(knowledgeBaseId, kb);
    // 持久化更新后的知识库数据
    await this.saveKnowledgeBases();

    // 重新准备知识库
    const documents = await Promise.all(
      kb.documents.map(async doc => ({
        pageContent: await this.fileParserService.parseFile(doc.path),
        metadata: {
          id: doc.id,
          source: doc.name
        }
      }))
    );

    await this.prepareKnowledgeBase(knowledgeBaseId, documents);
  }

  /**
   * 检索与查询最相关的文档
   * @param knowledgeBaseId 知识库ID
   * @param query 用户的查询语句
   * @returns 包含相关内容和相关性分数的结果数组
   */
  public async retrieveRelevantDocs(knowledgeBaseId: string, query: string): Promise<RelevantDoc[]> {
    const docs = this.documents.get(knowledgeBaseId);

    if (!docs) {
      throw new Error(`知识库 ${knowledgeBaseId} 未初始化`);
    }

    // 使用向量服务搜索相似文档
    const searchResults = await searchSimilarDocuments(query, knowledgeBaseId, 3);
    
    // 转换为 RelevantDoc 格式返回
    return searchResults.map(result => ({
      content: result.document.text,
      score: result.score
    }));
  }
}

export async function TestMain() {
  const options: VectorizationOptions = {
    knowledgeBaseId: 'kb123',
    texts: ['这是一段很长的测试文本...', '另一段测试文本...'],
    chunkSize: 1000,
    chunkOverlap: 200,
  };

  const result: VectorizationResult = await vectorizeAndStore(options);
  console.log(result);

  const vectors = getVectors();
  console.log('内存中的向量数量:', vectors.length);
  vectors.forEach((vec, index) => {
    console.log(`向量 ${index + 1}:`, vec.text.substring(0, 50), '向量维度:', vec.vector.length);
  });

  const knowledgeBase = new KnowledgeService();

  const res  = await knowledgeBase.retrieveRelevantDocs('kb123', '测试查询')
  console.log('查询结果==', res)

}

TestMain()