/**
 * 测试自定义嵌入模型的简单示例
 * 用于验证新的实现是否正常工作
 */

import { VectorStoreService } from './vector-store.service';
import { defaultModel } from '../vectorization/config';

/**
 * 测试向量存储服务
 */
export async function testVectorStoreService() {
  try {
    console.log('开始测试向量存储服务...');
    
    // 创建向量存储服务实例，使用默认模型
    const vectorStore = new VectorStoreService({
      dimension: 384,
      maxTokens: 256,
      name: 'Xenova/bge-large-zh',
      normalize: true,
      pooling: 'mean'
    });
    
    // 测试文档
    const testDocuments = [
      '这是第一个测试文档，包含一些示例内容。',
      '这是第二个测试文档，用于验证向量化功能。',
      '第三个文档包含不同的内容，用于测试相似性搜索。'
    ];
    
    const namespaceId = 'test-namespace';
    
    // 添加文档
    console.log('添加测试文档...');
    for (let i = 0; i < testDocuments.length; i++) {
      const documentId = `doc-${i + 1}`;
      await vectorStore.addDocument(
        namespaceId,
        documentId,
        testDocuments[i],
        { title: `测试文档 ${i + 1}` }
      );
    }
    
    // 测试搜索
    console.log('测试相似性搜索...');
    const searchResults = await vectorStore.searchSimilar(
      namespaceId,
      '测试文档内容',
      {
        topK: 3,
        similarityThreshold: 0.1,
        includeMetadata: true,
        highlightMatches: true
      }
    );
    
    console.log('搜索结果:', searchResults.length);
    searchResults.forEach((result, index) => {
      console.log(`结果 ${index + 1}:`);
      console.log(`  相似度: ${result.score}`);
      console.log(`  内容: ${result.chunk.content.substring(0, 50)}...`);
      console.log(`  元数据:`, result.chunk.metadata);
    });
    
    // 获取统计信息
    const stats = vectorStore.getNamespaceStats(namespaceId);
    console.log('命名空间统计:', stats);
    
    console.log('测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testVectorStoreService();
}