import crypto from 'crypto';

/**
 * 加密服务类，用于处理敏感数据的加密和解密
 */
export class EncryptionService {
  private algorithm: string = 'aes-256-cbc';
  private secretKey: Buffer;
  
  /**
   * 构造函数
   * @param secretKey 加密密钥，如果不提供则使用环境变量或生成随机密钥
   */
  constructor(secretKey?: string) {
    // 优先使用传入的密钥，其次使用环境变量，最后生成随机密钥
    const key = secretKey || process.env.ENCRYPTION_KEY || this.generateSecretKey();
    // 确保密钥长度为32字节(256位)
    this.secretKey = crypto.createHash('sha256').update(key).digest();
  }
  
  /**
   * 生成随机密钥
   * @returns 随机生成的密钥字符串
   */
  private generateSecretKey(): string {
    // 生成随机的16字节字符串作为密钥
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * 加密数据
   * @param data 要加密的数据
   * @returns 加密后的字符串
   */
  encrypt(data: string): string {
    try {
      // 生成随机初始化向量
      const iv = crypto.randomBytes(16);
      // 创建加密器
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      // 加密数据
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      // 返回 iv + 加密数据的格式
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('加密失败');
    }
  }
  
  /**
   * 解密数据
   * @param encryptedData 加密后的数据
   * @returns 解密后的原始数据
   */
  decrypt(encryptedData: string): string {
    try {
      // 分离 iv 和加密数据
      const [ivHex, encryptedText] = encryptedData.split(':');
      if (!ivHex || !encryptedText) {
        throw new Error('加密数据格式不正确');
      }
      
      // 将 iv 从 hex 转回 Buffer
      const iv = Buffer.from(ivHex, 'hex');
      // 创建解密器
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      // 解密数据
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      throw new Error('解密失败');
    }
  }
}