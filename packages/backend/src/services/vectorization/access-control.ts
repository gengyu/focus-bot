import { AccessControl } from './types';
import { VectorizationError } from './errors';
import { ErrorCode } from './errors';

/**
 * 访问控制实现
 * @class AccessControlImpl
 * @implements {AccessControl}
 */
export class AccessControlImpl implements AccessControl {
  async checkAccess(namespaceId: string, userId: string): Promise<boolean> {
    // TODO: 实现实际的访问控制逻辑
    return true;
  }

  async validateAccess(namespaceId: string, userId: string): Promise<void> {
    const hasAccess = await this.checkAccess(namespaceId, userId);
    if (!hasAccess) {
      throw new VectorizationError('没有访问权限', ErrorCode.ACCESS_DENIED);
    }
  }
}