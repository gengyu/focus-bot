import { Document } from 'langchain/document';
import { InputValidator } from './types';
import { VectorizationError } from './errors';
import { ErrorCode } from './errors';

/**
 * 输入验证实现
 * @class InputValidatorImpl
 * @implements {InputValidator}
 */
export class InputValidatorImpl implements InputValidator {
  validateDocument(doc: Document): void {
    if (!doc || typeof doc.pageContent !== 'string') {
      throw new VectorizationError('无效的文档格式', ErrorCode.INVALID_INPUT);
    }
    if (doc.pageContent.length === 0) {
      throw new VectorizationError('文档内容不能为空', ErrorCode.INVALID_INPUT);
    }
    if (doc.pageContent.length > 10000) {
      throw new VectorizationError('文档内容超过最大长度限制', ErrorCode.INVALID_INPUT);
    }
  }

  validateVector(vector: number[]): void {
    if (!Array.isArray(vector)) {
      throw new VectorizationError('向量必须是数组', ErrorCode.INVALID_INPUT);
    }
    if (vector.length === 0) {
      throw new VectorizationError('向量不能为空', ErrorCode.INVALID_INPUT);
    }
    if (!vector.every(num => typeof num === 'number' && !isNaN(num))) {
      throw new VectorizationError('向量包含无效的数值', ErrorCode.INVALID_INPUT);
    }
  }

  validateNamespaceId(namespaceId: string): void {
    if (!namespaceId || typeof namespaceId !== 'string') {
      throw new VectorizationError('无效的命名空间ID', ErrorCode.INVALID_INPUT);
    }
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(namespaceId)) {
      throw new VectorizationError('命名空间ID格式无效', ErrorCode.INVALID_INPUT);
    }
  }

  validateQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new VectorizationError('无效的查询字符串', ErrorCode.INVALID_INPUT);
    }
    if (query.length === 0) {
      throw new VectorizationError('查询字符串不能为空', ErrorCode.INVALID_INPUT);
    }
    if (query.length > 1000) {
      throw new VectorizationError('查询字符串超过最大长度限制', ErrorCode.INVALID_INPUT);
    }
  }
}