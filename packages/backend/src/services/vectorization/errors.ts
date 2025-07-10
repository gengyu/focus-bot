import { ErrorCode } from './types';

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  NAMESPACE_NOT_FOUND = 'NAMESPACE_NOT_FOUND',
  NAMESPACE_ALREADY_EXISTS = 'NAMESPACE_ALREADY_EXISTS',
  VECTORIZATION_FAILED = 'VECTORIZATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PLUGIN_ALREADY_EXISTS = 'PLUGIN_ALREADY_EXISTS'
}

/**
 * 向量化错误类型
 */
export class VectorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VectorizationError';
  }
}