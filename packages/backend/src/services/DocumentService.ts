import multer from "@koa/multer";
import {KnowledgeDocument} from "../../../../share/knowledge.ts";
import {v4 as uuidv4} from "uuid";
import {Singleton} from "../decorators/Singleton.ts";
import {createNamespace, getNamespace, searchSimilarDocuments, vectorizeAndStore} from "./vectorization";

import {FileParserService} from "./FileParserService.ts";


export interface RelevantDoc {
  content: string;
  score: number;
}


@Singleton()
export class DocumentService {
  private fileParserService: FileParserService;

  constructor() {
    this.fileParserService = FileParserService.getInstance();
  }

  /**
   *  上传文件
   * @param files
   */
  async uploadDocuments(files: Array<multer.File>): Promise<KnowledgeDocument[]> {

    if (!files || files.length === 0) {
      throw new Error('没有上传文件');
    }
    return files.map(file => {
      const docId = uuidv4();
      const docName = file.originalname;
      const path = file.path;

      return {
        id: docId,
        name: docName,
        path,
        size: file.size,
        createdAt: new Date().toISOString(),
        type: file.mimetype,
      }
    });
  }


  /**
   * 准备知识库索引的主方法
   * 执行完整流程：文档分块 -> 创建并填充 FlexSearch 索引
   */
  private async prepareKnowledgeBase(document: KnowledgeDocument) {
    const exists = await getNamespace(document.id);
    if (!exists) await createNamespace({id: document.id,});
    const pageContent = await this.fileParserService.parseFile(document.path);

    await vectorizeAndStore({
      namespaceId: document.id,
      texts: [pageContent],
    });
  }


  /**
   * 检索与查询最相关的文档
   * @param documents 用户的查询语句
   * @param query 用户的查询语句
   * @returns 包含相关内容和相关性分数的结果数组
   */
  public async retrieveRelevantDocs( query: string, documents: KnowledgeDocument[], topK: number = 3): Promise<RelevantDoc[]> {
    await Promise.all(documents.map(async (document)=>this.prepareKnowledgeBase(document)));

    // 使用向量服务搜索相似文档
    const searchResults = await Promise.all(documents.map(async document => {
      return await searchSimilarDocuments(query, document.id, topK);
    }));

    // 转换为 RelevantDoc 格式返回
    return searchResults.flat().map(result => ({
      content: result.document.text,
      score: result.score
    }));
  }

}