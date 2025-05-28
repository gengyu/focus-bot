/**
 * 知识服务模块
 * 整合向量化服务，提供知识库管理功能
 */

// import { Injectable } from '@nestjs/common';
import {Document} from 'langchain/document';
import vectorizationService, {
  createNamespace,
  getNamespace,
  deleteNamespace,
  vectorizeAndStore,
  searchSimilarDocuments,
  VectorizationOptions,
  VectorizationResult,
  SearchResult
} from '../vectorization/index';


/**
 * 创建知识库命名空间
 * @param namespaceId 命名空间ID
 * @param metadata 元数据
 * @returns 创建的命名空间
 */
async function createKnowledgeBase(namespaceId: string, metadata: Record<string, any> = {}) {
  return createNamespace({
    id: namespaceId,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

/**
 * 获取知识库命名空间
 * @param namespaceId 命名空间ID
 * @returns 命名空间信息
 */
async function getKnowledgeBase(namespaceId: string) {
  return getNamespace(namespaceId);
}

/**
 * 删除知识库命名空间
 * @param namespaceId 命名空间ID
 * @returns 是否删除成功
 */
async function deleteKnowledgeBase(namespaceId: string) {
  return deleteNamespace(namespaceId);
}

/**
 * 添加文档到知识库
 * @param namespaceId 命名空间ID
 * @param texts 文本数组
 * @param options 向量化选项
 * @returns 处理结果
 */
async function addDocuments(namespaceId: string, texts: string[], options: Partial<VectorizationOptions> = {}) {
  return vectorizeAndStore({
    namespaceId,
    texts,
    ...options
  });
}

/**
 * 搜索相似文档
 * @param query 查询文本
 * @param namespaceId 命名空间ID
 * @param topK 返回结果数量
 * @returns 搜索结果
 */
async function search(query: string, namespaceId: string, topK: number = 3) {
  return searchSimilarDocuments(query, namespaceId, topK);
}

/**
 * 获取向量化服务实例
 * 用于高级操作，如注册插件、订阅事件等
 * @returns 向量化服务实例
 */
function getVectorizationService() {
  return vectorizationService;
}
