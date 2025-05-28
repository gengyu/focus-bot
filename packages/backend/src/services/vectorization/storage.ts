import { Storage, Namespace, VectorDocument } from './types';

/**
 * 内存存储实现
 * @class MemoryStorage
 * @implements {Storage}
 */
export class MemoryStorage implements Storage {
  // 向量存储（内存中）
  private vectorStore: VectorDocument[] = [];

  // 命名空间存储（内存中）
  private namespaceStore: Map<string, Namespace> = new Map();

  async saveNamespace(namespace: Namespace): Promise<void> {
    this.namespaceStore.set(namespace.id, namespace);
  }

  async getNamespace(id: string): Promise<Namespace | null> {
    const namespace = this.namespaceStore.get(id);
    return namespace || null;
  }

  async save(vectors: number[][], namespaceId: string): Promise<void> {
    // 这里简化实现，实际应用中需要更完善的存储逻辑
    for (let i = 0; i < vectors.length; i++) {
      const vec: VectorDocument = {
        id: `${namespaceId}-${this.vectorStore.length + i}`,
        text: '', // 这里需要实际文本内容
        vector: vectors[i],
        metadata: { namespaceId }
      };
      this.vectorStore.push(vec);
    }
  }

  async findByNamespace(namespaceId: string): Promise<any[]> {
    return this.vectorStore.filter(vec => vec.metadata.namespaceId === namespaceId);
  }

  /**
   * 获取内存中的向量
   * @param {string} [namespaceId] - 可选的命名空间ID
   * @returns {VectorDocument[]} 向量文档数组
   */
  getVectors(namespaceId?: string): VectorDocument[] {
    if (namespaceId) {
      return this.vectorStore.filter(vec => vec.metadata.namespaceId === namespaceId);
    }
    return this.vectorStore;
  }

  /**
   * 清理特定命名空间的向量
   * @param {string} namespaceId - 命名空间ID
   */
  clearVectorsByNamespaceId(namespaceId: string): void {
    this.vectorStore = this.vectorStore.filter(vec => vec.metadata.namespaceId !== namespaceId);
  }

  /**
   * 存储向量文档
   * @param {Document[]} documents - 文档数组
   * @param {number[][]} vectors - 向量数组
   * @param {string} namespaceId - 命名空间ID
   * @returns {VectorDocument[]} 存储的向量文档数组
   */
  storeVectors(documents: any[], vectors: number[][], namespaceId: string): VectorDocument[] {
    const newVectors: VectorDocument[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const vec: VectorDocument = {
        id: `${namespaceId}-${this.vectorStore.length + i}`,
        text: documents[i].pageContent,
        vector: vectors[i],
        metadata: documents[i].metadata,
      };
      this.vectorStore.push(vec);
      newVectors.push(vec);
    }
    
    return newVectors;
  }
}