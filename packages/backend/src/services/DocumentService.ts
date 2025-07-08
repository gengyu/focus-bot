import multer from "@koa/multer";
import { KnowledgeDocument } from "../../../../share/knowledge.ts";
import { v4 as uuidv4 } from "uuid";
import { Singleton } from "../decorators/Singleton.ts";
import multer from "@koa/multer";

/**
 * 文档服务 - 简化版本
 * 主要负责文件上传和基本文档对象创建
 * 复杂的知识库功能已迁移到 EnhancedKnowledgeService
 */
@Singleton()
export class DocumentService {
  
  constructor() {
    // 简化构造函数
  }

  /**
   * 上传文件并创建文档对象
   * @param files 上传的文件数组
   * @returns 创建的文档对象数组
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
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      };
    });
  }
}