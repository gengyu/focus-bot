// import { Body, Controller, Post } from '../decorators/decorators';
// import { ResultHelper } from './routeHelper';
// import { RAGService } from '../services/rag.service';
// import { OpenAIProvider } from '../provider/OpenAIProvider';
// import {
//   RAGRequest,
//   RAGResponse,
//   PrepareKnowledgeBaseRequest,
//   PrepareKnowledgeBaseResponse,
//   InitResponse,
//   ErrorResponse,
// } from '../types/rag.types';
// import { ProviderConfig } from '../../../../share/type';
//
// @Controller('/invoke/rag')
// export class RAGController {
//   private ragService: RAGService;
//
//   constructor() {
//     const providerConfig: ProviderConfig = {
//       id: 'openai',
//       name: 'OpenAI',
//       enabled: true,
//       apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
//       apiKey: process.env.OPENAI_API_KEY || '',
//       models: [],
//       temperature: 0.7,
//       maxTokens: 2000,
//     };
//     const llmProvider = new OpenAIProvider(providerConfig);
//     this.ragService = new RAGService(llmProvider);
//   }
//
//   @Post('/init')
//   async initialize() {
//     try {
//       await this.ragService.initialize();
//       const response: InitResponse = { message: 'RAG service initialized successfully' };
//       return ResultHelper.success(response);
//     } catch (error) {
//       const errorResponse: ErrorResponse = { error: 'Failed to initialize RAG service' };
//       return ResultHelper.fail(errorResponse.error, null);
//     }
//   }
//
//   @Post('/prepare')
//   async prepareKnowledgeBase(@Body() body: PrepareKnowledgeBaseRequest) {
//     try {
//       const { documents } = body;
//       if (!documents || !Array.isArray(documents)) {
//         const errorResponse: ErrorResponse = { error: 'Invalid documents format' };
//         return ResultHelper.fail(errorResponse.error, null);
//       }
//       await this.ragService.prepareKnowledgeBase(documents);
//       const response: PrepareKnowledgeBaseResponse = { message: 'Knowledge base prepared successfully' };
//       return ResultHelper.success(response);
//     } catch (error) {
//       const errorResponse: ErrorResponse = { error: 'Failed to prepare knowledge base' };
//       return ResultHelper.fail(errorResponse.error, null);
//     }
//   }
//
//   @Post('/chat')
//   async ragChat(@Body() body: RAGRequest) {
//     try {
//       const { query } = body;
//       if (!query) {
//         const errorResponse: ErrorResponse = { error: 'Query is required' };
//         return ResultHelper.fail(errorResponse.error, null);
//       }
//       const result = await this.ragService.ragPipeline(query);
//       const response: RAGResponse = result;
//       return ResultHelper.success(response);
//     } catch (error) {
//       const errorResponse: ErrorResponse = { error: 'Failed to process query' };
//       return ResultHelper.fail(errorResponse.error, null);
//     }
//   }
// }
// // 不再导出 router，Controller 装饰器注册路由