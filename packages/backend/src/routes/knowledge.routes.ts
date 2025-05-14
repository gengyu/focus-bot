import Router from 'koa-router';
import { RAGService } from '../services/rag.service';
import { OpenAIProvider } from '../provider/OpenAIProvider';
import { ProviderConfig } from '../../../../share/type';
import multer from '@koa/multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = new Router();
const upload = multer({ dest: 'uploads/' });

// 创建 LLM Provider
const providerConfig: ProviderConfig = {
  id: 'openai',
  name: 'OpenAI',
  enabled: true,
  apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  models: [],
  temperature: 0.7,
  maxTokens: 2000,
};

const llmProvider = new OpenAIProvider(providerConfig);
const ragService = new RAGService(llmProvider);

interface KnowledgeBase {
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

interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

interface ChatRequest {
  query: string;
}

// 存储知识库信息
const knowledgeBases = new Map<string, KnowledgeBase>();

// 获取知识库列表
router.get('/knowledge-bases', async (ctx) => {
  ctx.body = Array.from(knowledgeBases.values());
});

// 创建知识库
router.post('/knowledge-bases', async (ctx) => {
  const { name, description } = ctx.request.body as CreateKnowledgeBaseRequest;
  
  if (!name) {
    ctx.status = 400;
    ctx.body = { error: '知识库名称不能为空' };
    return;
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

  knowledgeBases.set(id, knowledgeBase);
  ctx.body = knowledgeBase;
});

// 删除知识库
router.delete('/knowledge-bases/:id', async (ctx) => {
  const { id } = ctx.params;
  const kb = knowledgeBases.get(id);

  if (!kb) {
    ctx.status = 404;
    ctx.body = { error: '知识库不存在' };
    return;
  }

  // 删除相关文件
  for (const doc of kb.documents) {
    try {
      fs.unlinkSync(doc.path);
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }

  knowledgeBases.delete(id);
  ctx.status = 204;
});

// 上传文档
router.post('/knowledge-bases/:id/documents', upload.array('files'), async (ctx) => {
  const { id } = ctx.params;
  const kb = knowledgeBases.get(id);

  if (!kb) {
    ctx.status = 404;
    ctx.body = { error: '知识库不存在' };
    return;
  }

  const files = ctx.files as Array<{
    originalname: string;
    path: string;
  }>;

  if (!files || files.length === 0) {
    ctx.status = 400;
    ctx.body = { error: '没有上传文件' };
    return;
  }

  try {
    // 处理上传的文件
    for (const file of files) {
      const docId = uuidv4();
      const docName = file.originalname;
      const docPath = file.path;

      kb.documents.push({
        id: docId,
        name: docName,
        path: docPath
      });
    }

    kb.documentCount = kb.documents.length;
    knowledgeBases.set(id, kb);

    // 准备知识库
    const documents = kb.documents.map(doc => ({
      pageContent: fs.readFileSync(doc.path, 'utf-8'),
      metadata: {
        id: doc.id,
        source: doc.name
      }
    }));

    await ragService.prepareKnowledgeBase(documents);

    ctx.body = { message: '文档上传成功' };
  } catch (error) {
    console.error('处理上传文件失败:', error);
    ctx.status = 500;
    ctx.body = { error: '处理上传文件失败' };
  }
});

// 知识库对话
router.post('/knowledge-bases/:id/chat', async (ctx) => {
  const { id } = ctx.params;
  const { query } = ctx.request.body as ChatRequest;

  if (!query) {
    ctx.status = 400;
    ctx.body = { error: '查询不能为空' };
    return;
  }

  const kb = knowledgeBases.get(id);
  if (!kb) {
    ctx.status = 404;
    ctx.body = { error: '知识库不存在' };
    return;
  }

  try {
    const result = await ragService.ragPipeline(query);
    ctx.body = result;
  } catch (error) {
    console.error('处理查询失败:', error);
    ctx.status = 500;
    ctx.body = { error: '处理查询失败' };
  }
});

export default router; 