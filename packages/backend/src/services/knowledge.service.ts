import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import {IndexFlatL2} from 'faiss-node';
import {Document} from '../types/rag.types';
import {PersistenceService} from './PersistenceService';
import {SearchService} from './SearchService';
import {FileParserService} from "./FileParserService.ts";
import {Singleton} from "../decorators/Singleton.ts";



export interface KnowledgeBase {
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

export interface KnowledgeDocument {
  id: string;
  name: string;
  path: string;
  content?: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

interface RelevantDoc {
  content: string;
  score: number;
}

@Singleton()
export class KnowledgeService {
  private knowledgeBases: Map<string, KnowledgeBase>;
  private indexes: Map<string, IndexFlatL2> = new Map();
  private documents: Map<string, Document[]> = new Map();
  private vocabulary: Set<string> = new Set();
  private idf: Map<string, number> = new Map();
  
  // private readonly llmProvider: LLMProvider;
  private readonly searchService: SearchService;
  private readonly persistenceService: PersistenceService<Record<string, KnowledgeBase>>;
  private readonly modelId: string = 'gpt-3.5-turbo';

  private fileParserService: FileParserService;

  constructor() {
    this.knowledgeBases = new Map<string, KnowledgeBase>();
    // this.llmProvider = llmProvider;
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
   * 文本预处理
   * 将文本转换为小写，去除标点符号，并拆分为单词数组
   * @param text 需要预处理的文本
   * @returns 处理后的单词数组
   */
  private preprocessText(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * 生成文本嵌入向量
   * 使用TF-IDF算法将文本转换为数值向量
   * @param text 需要生成嵌入的文本
   * @returns 生成的数值向量
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const words = this.preprocessText(text);
    const wordFreq = new Map<string, number>();
    
    // 计算词频
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // 构建向量
    const vector = new Array(this.vocabulary.size).fill(0);
    let index = 0;
    for (const word of this.vocabulary) {
      const tf = wordFreq.get(word) || 0;
      const idf = this.idf.get(word) || 1;
      vector[index] = tf * idf;
      index++;
    }

    // 归一化向量
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  /**
   * 更新词汇表和IDF值
   * 根据提供的文档集合更新词汇表和逆文档频率统计
   * @param documents 包含文本内容的文档数组
   */
  private updateVocabulary(documents: Document[]) {
    // 更新词汇表
    documents.forEach(doc => {
      const words = this.preprocessText(doc.pageContent);
      words.forEach(word => this.vocabulary.add(word));
    });

    // 计算 IDF
    const totalDocs = documents.length;
    this.vocabulary.forEach(word => {
      const docsWithWord = documents.filter(doc => 
        this.preprocessText(doc.pageContent).includes(word)
      ).length;
      this.idf.set(word, Math.log(totalDocs / (docsWithWord + 1)));
    });
  }

  /**
   * 准备知识库索引的主方法
   * 执行完整流程：文档分块 -> 生成嵌入 -> 创建并填充 FAISS 索引
   * @param knowledgeBaseId 知识库ID
   * @param documents 需要处理的原始文档数组
   */
  private async prepareKnowledgeBase(knowledgeBaseId: string, documents: Document[]) {
    // 更新词汇表和IDF
    this.updateVocabulary(documents);
    this.documents.set(knowledgeBaseId, documents);
    
    // 为每个文档生成嵌入向量
    const embeddings = await Promise.all(
      documents.map(doc => this.generateEmbedding(doc.pageContent))
    );
    
    // 创建 FAISS 索引
    if (embeddings.length > 0) {
      const dimension = this.vocabulary.size;
      const index = new IndexFlatL2(dimension);
      
      // 将向量添加到索引
      const vectors = embeddings.flat();
      index.add(vectors);
      
      this.indexes.set(knowledgeBaseId, index);
    } else {
      const dimension = this.vocabulary.size;
      const index = new IndexFlatL2(dimension);
      this.indexes.set(knowledgeBaseId, index);
    }
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
    // 初始化空知识库
    // await this.prepareKnowledgeBase(id, []);
    // 持久化知识库数据
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

    // 删除知识库索引和文档
    this.indexes.delete(id);
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
  async uploadDocuments(id: string, files: Array<{ originalname: string; path: string }>): Promise<void> {
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

      // // 确保文件保存在上传目录中
      // const targetPath = path.join(this.uploadDir, `${docId}-${docName}`);
      // 
      // // 如果文件不在上传目录中，复制到上传目录
      // if (file.path !== targetPath) {
      //   const content = await fs.readFile(file.path, 'utf-8');
      //   await fs.writeFile(targetPath, content, 'utf-8');
      // }

      kb.documents.push({
        id: docId,
        name: docName,
        path
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
        pageContent: await fs.readFile(doc.path, 'utf-8'),
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
    const index = this.indexes.get(knowledgeBaseId);
    const docs = this.documents.get(knowledgeBaseId);

    if (!index || !docs) {
      throw new Error(`知识库 ${knowledgeBaseId} 未初始化`);
    }

    // 生成查询的嵌入向量
    const queryEmbedding = await this.generateEmbedding(query);

    // 在 FAISS 中搜索相似文档
    const { distances, labels } = index.search(queryEmbedding, 3);

    return labels.map((label: number, i: number) => ({
      content: docs[label].pageContent,
      score: 1 - distances[i] // 将距离转换为相似度分数
    }));
  }


  // async chat(id: string, query: string): Promise<{ answer: string; sources: string[] }> {
  //   if (!query) {
  //     throw new Error('查询不能为空');
  //   }
  //
  //   const kb = this.knowledgeBases.get(id);
  //   if (!kb) {
  //     throw new Error('知识库不存在');
  //   }
  //
  //   // 检查知识库是否存在
  //   if (!this.indexes.has(id)) {
  //     throw new Error(`知识库 ${id} 不存在`);
  //   }
  //
  //   // 1. 获取相关文档
  //   const relevantDocs = await this.retrieveRelevantDocs(id, query);
  //
  //   // 2. 构建提示词
  //   const context = relevantDocs.map(doc => doc.content).join('\n\n');
  //   const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;
  //
  //   // 3. 使用搜索服务增强上下文
  //   const messages: ChatMessage[] = [
  //     {
  //       id: Date.now().toString(),
  //       role: 'user',
  //       content: prompt,
  //       timestamp: Date.now(),
  //       type: 'text'
  //     }
  //   ];
  //
  //   const enhancedMessages = await this.searchService.enhanceWithSearch(query, messages);
  //
  //   // 4. 调用 LLM 生成最终回答
  //   const response = await this.llmProvider.chat(enhancedMessages, this.modelId);
  //
  //   return {
  //     answer: response.content,
  //     sources: relevantDocs.map(doc => doc.content) // 返回引用的文档内容
  //   };
  // }
}