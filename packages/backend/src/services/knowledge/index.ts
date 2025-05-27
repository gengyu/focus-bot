/**
 * 知识服务模块入口文件
 * 导出知识服务和向量化服务
 */

// 导出知识服务
export * from './knowledge.service';

// 导出向量化服务
export * from './vectorization';

// 默认导出知识服务
import { KnowledgeService } from './knowledge.service';
export default KnowledgeService;