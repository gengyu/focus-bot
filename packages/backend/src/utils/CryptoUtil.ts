import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private static readonly ENCODING = 'utf8';
  private static readonly KEY_FILE_PATH = process.env.ENCRYPTION_KEY_FILE || path.join(process.cwd(), 'data/.encryption.key');
  private static _key: Buffer | null = null;

  /**
   * 生成新的加密密钥
   * @returns 生成的密钥
   */
  private static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  /**
   * 获取或生成加密密钥
   * @returns 加密密钥
   */
  private static getKey(): Buffer {
    if (this._key) {
      return this._key;
    }

    try {
      // 尝试从环境变量获取密钥
      if (process.env.ENCRYPTION_KEY) {
        const envKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        if (envKey.length === this.KEY_LENGTH) {
          this._key = envKey;
          return this._key;
        }
      }

      // 尝试从文件读取密钥
      if (fs.existsSync(this.KEY_FILE_PATH)) {
        const fileKey = Buffer.from(fs.readFileSync(this.KEY_FILE_PATH, 'utf8'), 'hex');
        if (fileKey.length === this.KEY_LENGTH) {
          this._key = fileKey;
          return this._key;
        }
      }

      // 生成新密钥并保存
      this._key = this.generateKey();
      fs.writeFileSync(this.KEY_FILE_PATH, this._key.toString('hex'), { mode: 0o600 });
      return this._key;
    } catch (error) {
      throw new Error(`获取加密密钥失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 加密字符串
   * @param text 要加密的文本
   * @returns 加密后的文本（格式：iv:authTag:encryptedData）
   */
  public static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const key = this.getKey();
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      let encrypted = cipher.update(text, this.ENCODING, 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // 将 iv、authTag 和加密数据组合成单个字符串
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(`加密失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解密字符串
   * @param encryptedText 加密的文本（格式：iv:authTag:encryptedData）
   * @returns 解密后的原文
   */
  public static decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('无效的加密文本格式');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const key = this.getKey();

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, this.ENCODING);
      decrypted += decipher.final(this.ENCODING);

      return decrypted;
    } catch (error) {
      throw new Error(`解密失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}