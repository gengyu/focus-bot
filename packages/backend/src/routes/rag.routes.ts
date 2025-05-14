import Router from 'koa-router';
import { RAGService } from '../services/rag.service';
import { OpenAIProvider } from '../provider/OpenAIProvider';
import {
  RAGRequest,
  RAGResponse,
  PrepareKnowledgeBaseRequest,
  PrepareKnowledgeBaseResponse,
  InitResponse,
  ErrorResponse,
} from '../types/rag.types';
import { ProviderConfig } from '../../../../share/type';

const router = new Router();

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

// 初始化 RAG 服务
router.post('/init', async (ctx) => {
  try {
    await ragService.initialize();
    const response: InitResponse = { message: 'RAG service initialized successfully' };
    ctx.body = response;
  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Failed to initialize RAG service' };
    ctx.status = 500;
    ctx.body = errorResponse;
  }
});

// 准备知识库
router.post('/prepare', async (ctx) => {
  try {
    const { documents } = ctx.request.body as PrepareKnowledgeBaseRequest;
    if (!documents || !Array.isArray(documents)) {
      const errorResponse: ErrorResponse = { error: 'Invalid documents format' };
      ctx.status = 400;
      ctx.body = errorResponse;
      return;
    }

    await ragService.prepareKnowledgeBase(documents);
    const response: PrepareKnowledgeBaseResponse = { message: 'Knowledge base prepared successfully' };
    ctx.body = response;
  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Failed to prepare knowledge base' };
    ctx.status = 500;
    ctx.body = errorResponse;
  }
});

// 聊天接口
router.post('/chat', async (ctx) => {
  try {
    const { query } = ctx.request.body as RAGRequest;
    if (!query) {
      const errorResponse: ErrorResponse = { error: 'Query is required' };
      ctx.status = 400;
      ctx.body = errorResponse;
      return;
    }

    const result = await ragService.ragPipeline(query);
    const response: RAGResponse = result;
    ctx.body = response;
  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Failed to process query' };
    ctx.status = 500;
    ctx.body = errorResponse;
  }
});

export default router; 