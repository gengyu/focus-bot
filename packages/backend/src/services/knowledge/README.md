# 知识服务模块

本模块提供了基于本地向量化模型的知识库管理功能，替换了原有的 OpenAI 嵌入模型。

## 主要变更

### 1. 自定义嵌入模型 (CustomEmbeddings)

- **文件**: `custom-embeddings.ts`
- **功能**: 实现 LangChain 的 Embeddings 接口，使用本地向量化模型
- **优势**: 
  - 无需 OpenAI API 密钥
  - 支持离线使用
  - 使用 Xenova/transformers 本地模型

### 2. 向量存储服务更新 (VectorStoreService)

- **变更**: 构造函数参数从 `openaiApiKey` 改为 `model?: EmbeddingModel`
- **默认模型**: `Xenova/all-MiniLM-L6-v2`
- **向量维度**: 384

## 使用方法

### 基本用法

```typescript
import { VectorStoreService } from './vector-store.service';
import { defaultModel } from '../vectorization/config';

// 使用默认模型
const vectorStore = new VectorStoreService();

// 使用自定义模型
const customModel = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  maxTokens: 256,
  pooling: 'mean',
  normalize: true
};
const vectorStoreWithCustomModel = new VectorStoreService(customModel);
```

### 添加文档

```typescript
const namespaceId = 'my-knowledge-base';
const documentId = 'doc-1';
const content = '这是一个示例文档内容';
const metadata = { title: '示例文档', author: '作者' };

const chunks = await vectorStore.addDocument(
  namespaceId,
  documentId,
  content,
  metadata
);
```

### 搜索相似文档

```typescript
const searchResults = await vectorStore.searchSimilar(
  namespaceId,
  '搜索查询',
  {
    topK: 5,
    similarityThreshold: 0.7,
    includeMetadata: true,
    highlightMatches: true
  }
);
```

## 测试

运行测试文件验证功能：

```bash
cd packages/backend
npx tsx src/services/knowledge/test-custom-embeddings.ts
```

## 依赖

- `@langchain/core`: LangChain 核心包
- `@xenova/transformers`: 本地 Transformers 模型
- `langchain`: LangChain 主包

## 配置

默认配置位于 `../vectorization/config.ts`：

```typescript
export const defaultModel: EmbeddingModel = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  maxTokens: 256,
  pooling: 'mean',
  normalize: true
};
```

## 注意事项

1. 首次使用时会下载模型文件，需要网络连接
2. 模型文件缓存在 `/data/.cache/` 目录
3. 向量维度固定为 384（与模型相关）
4. 支持中英文文本向量化