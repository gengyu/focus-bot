import { VectorCache } from './types';

/**
 * 内存向量缓存实现
 * @class MemoryVectorCache
 * @implements {VectorCache}
 */
export class MemoryVectorCache implements VectorCache {
  private cache: Map<string, { vector: number[]; timestamp: number }> = new Map();
  private readonly ttl: number;

  constructor(ttl: number = 3600 * 1000) {
    this.ttl = ttl;
  }

  async get(key: string): Promise<number[] | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.vector;
  }

  async set(key: string, vector: number[]): Promise<void> {
    this.cache.set(key, {
      vector,
      timestamp: Date.now()
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }
}