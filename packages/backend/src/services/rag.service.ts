import { IndexFlatL2 } from 'faiss-node';
import { pipeline } from '@xenova/transformers';
import { LLMProvider } from '../provider/LLMProvider';
import { ChatMessage } from '../../../../share/type';
import { SearchService } from './SearchService';
import fs from 'fs/promises';
import path from 'path';

interface Document {
  pageContent: string;
  metadata: {
    id: string;
    source: string;
    [key: string]: any;
  };
}

interface RelevantDoc {
  content: string;
  score: number;
}

/**
 * 基于检索增强生成(RAG)的服务类，实现了以下核心功能：
 * 1. 使用 Transformers.js 创建文本嵌入表示
 * 2. 利用 FAISS 进行高效向量相似性搜索
 * 3. 整合 LLMProvider 提供的语言模型能力
 * 4. 结合 SearchService 进行上下文增强
 */
export class RAGService {
  private readonly llmProvider: LLMProvider;
  private readonly searchService: SearchService;
  private index: IndexFlatL2 | null = null;
  private documents: Document[] = [];
  private readonly modelId: string = 'gpt-3.5-turbo';
  private embeddingPipeline: any = null;
  private readonly baseDir: string;

  /**
   * 构造函数初始化必要的依赖服务
   * @param llmProvider 大语言模型提供者实例
   */
  constructor(llmProvider: LLMProvider, baseDir: string = 'knowledge_bases') {
    this.llmProvider = llmProvider;
    this.searchService = new SearchService();
    this.baseDir = baseDir;
  }

  /**
   * 初始化文本嵌入模型管道
   * 使用 Xenova/all-MiniLM-L6-v2 模型进行文本特征提取
   */
  private async initEmbeddingPipeline() {
    if (!this.embeddingPipeline) {
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  }

  /**
   * 准备知识库索引的主方法
   * 执行完整流程：文档分块 -> 生成嵌入 -> 创建并填充 FAISS 索引
   * @param kbId 知识库唯一标识符
   * @param documents 需要处理的原始文档数组
   */
  async prepareKnowledgeBase(kbId: string, documents: Document[]) {
    // 初始化 embedding pipeline
    await this.initEmbeddingPipeline();
    
    // 将文档分块
    const chunks = this.splitDocuments(documents);
    this.documents = chunks;
    
    // 为每个块生成嵌入向量
    const embeddings = await Promise.all(
      chunks.map(chunk => this.generateEmbedding(chunk.pageContent))
    );
    
    // 创建 FAISS 索引
    const dimension = embeddings[0].length;
    this.index = new IndexFlatL2(dimension);
    
    // 将向量添加到索引
    const vectors = embeddings.flat();
    this.index.add(vectors);

    // 保存知识库
    await this.saveKnowledgeBase(kbId);
  }

  /**
   * 将文档按段落分割为更小的文本块
   * @param documents 需要分割的原始文档数组
   * @returns 分割后的文档块数组
   */
  private splitDocuments(documents: Document[]): Document[] {
    const chunks: Document[] = [];
    
    for (const doc of documents) {
      // 简单的按段落分割
      const paragraphs = doc.pageContent.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          chunks.push({
            pageContent: paragraph,
            metadata: {
              ...doc.metadata,
              id: `${doc.metadata.id}-${chunks.length}`
            }
          });
        }
      }
    }
    
    return chunks;
  }

  /**
   * 为给定文本生成嵌入向量
   * @param text 需要生成嵌入的文本内容
   * @returns 数值化的向量表示（浮点数数组）
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    await this.initEmbeddingPipeline();
    const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }

  /**
   * 检索与查询最相关的文档
   * @param query 用户的查询语句
   * @returns 包含相关内容和相关性分数的结果数组
   */
  private async retrieveRelevantDocs(query: string): Promise<RelevantDoc[]> {
    if (!this.index) {
      throw new Error('FAISS 索引未初始化');
    }

    // 生成查询的嵌入向量
    const queryEmbedding = await this.generateEmbedding(query);
    
    // 在 FAISS 中搜索相似文档
    const { distances, labels } = this.index.search(queryEmbedding, 3);
    
    return labels.map((label: number, i: number) => ({
      content: this.documents[label].pageContent,
      score: 1 - distances[i] // 将距离转换为相似度分数
    }));
  }

  /**
   * 完整的 RAG 流水线执行方法
   * 执行从检索到生成回答的完整流程
   * @param query 用户的查询语句
   * @returns 包含回答和引用来源的结果对象
   */
  async ragPipeline(query: string): Promise<{ answer: string; sources: string[] }> {
    // 1. 获取相关文档
    const relevantDocs = await this.retrieveRelevantDocs(query);
    
    // 2. 构建提示词
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;
    
    // 3. 使用搜索服务增强上下文
    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        type: 'text'
      }
    ];
    
    const enhancedMessages = await this.searchService.enhanceWithSearch(query, messages);
    
    // 4. 调用 LLM 生成最终回答
    const response = await this.llmProvider.chat(enhancedMessages, this.modelId);
    
    return {
      answer: response.content,
      sources: relevantDocs.map(doc => doc.content) // 返回引用的文档内容
    };
  }

  private async ensureDir(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * 将 FAISS 索引保存到磁盘文件
   * @param kbId 知识库唯一标识符
   */
  async saveKnowledgeBase(kbId: string): Promise<void> {
    const kbDir = path.join(this.baseDir, kbId);
    await this.ensureDir(kbDir);

    if (this.index) {
      await this.index.write(path.join(kbDir, 'index.faiss'));
    }
    await fs.writeFile(
      path.join(kbDir, 'documents.json'),
      JSON.stringify(this.documents, null, 2)
    );
  }
  
  /**
   * 加载完整的知识库（索引 + 文档数据）
   * @param kbId 知识库唯一标识符
   */
  async loadKnowledgeBase(kbId: string): Promise<void> {
    const kbDir = path.join(this.baseDir, kbId);
    
    try {
      // 加载索引
      const indexPath = path.join(kbDir, 'index.faiss');
      if (await fs.access(indexPath).then(() => true).catch(() => false)) {
        this.index = await IndexFlatL2.read(indexPath);
      }

      // 加载文档
      const docsPath = path.join(kbDir, 'documents.json');
      if (await fs.access(docsPath).then(() => true).catch(() => false)) {
        const data = await fs.readFile(docsPath, 'utf-8');
        this.documents = JSON.parse(data);
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      throw new Error('加载知识库失败');
    }
  }

  /**
   * 删除知识库
   * @param kbId 知识库唯一标识符
   */
  async deleteKnowledgeBase(kbId: string): Promise<void> {
    const kbDir = path.join(this.baseDir, kbId);
    try {
      await fs.rm(kbDir, { recursive: true, force: true });
    } catch (error) {
      console.error('删除知识库失败:', error);
      throw new Error('删除知识库失败');
    }
  }
} // end of RAGService class
