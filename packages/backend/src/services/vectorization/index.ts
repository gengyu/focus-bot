/**
 * 向量化服务模块入口文件
 * 导出所有需要对外暴露的接口、类型和函数
 */

// 导出类型定义
export * from './types';

// 导出错误处理
export * from './errors';

// 导出配置管理
export * from './config';

// 导出日志管理
export * from './logging';

// 导出性能监控
export * from './performance';

// 导出缓存
export * from './cache';

// 导出存储
export * from './storage';

// 导出验证
export * from './validation';

// 导出访问控制
export * from './access-control';

// 导出事件总线
export * from './events';

// 导出插件管理
export * from './plugins';

// 导出工具函数
export * from './utils';

// 导出向量化函数
export * from './vectorizer';

// 导出服务实现
export * from './service';

// 默认导出向量化服务实例
import { vectorizationService } from './service';
export default vectorizationService;