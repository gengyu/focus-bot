import { EncryptionService } from '../services/EncryptionService';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  test('should encrypt and decrypt text correctly', () => {
    const originalText = 'Hello, World!';
    const secretKey = 'my-secret-key-123';
    const service = new EncryptionService(secretKey);

    const encrypted = service.encrypt(originalText);
    expect(encrypted).not.toBe(originalText);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  test('should handle empty string encryption', () => {
    const originalText = '';
    const secretKey = 'my-secret-key';
    const service = new EncryptionService(secretKey);

    const encrypted = service.encrypt(originalText);
    const decrypted = service.decrypt(encrypted);
    
    expect(decrypted).toBe(originalText);
  });

  test('should handle special characters and unicode', () => {
    const originalText = '你好世界! 🌍 Special chars: @#$%^&*()';
    const secretKey = 'unicode-key-测试';
    const service = new EncryptionService(secretKey);

    const encrypted = service.encrypt(originalText);
    const decrypted = service.decrypt(encrypted);
    
    expect(decrypted).toBe(originalText);
  });

  test('should produce different encrypted results for same text with different keys', () => {
    const originalText = 'Same text to encrypt';
    const key1 = 'key1';
    const key2 = 'key2';
    const service1 = new EncryptionService(key1);
    const service2 = new EncryptionService(key2);

    const encrypted1 = service1.encrypt(originalText);
    const encrypted2 = service2.encrypt(originalText);
    
    expect(encrypted1).not.toBe(encrypted2);
  });

  test('should handle long text encryption', () => {
    const longText = 'A'.repeat(10000); // 10KB of text
    const secretKey = 'long-text-key';
    const service = new EncryptionService(secretKey);

    const encrypted = service.encrypt(longText);
    const decrypted = service.decrypt(encrypted);
    
    expect(decrypted).toBe(longText);
    expect(decrypted.length).toBe(10000);
  });

  test('should handle JSON data encryption', () => {
    const jsonData = JSON.stringify({
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });
    const secretKey = 'json-encryption-key';
    const service = new EncryptionService(secretKey);

    const encrypted = service.encrypt(jsonData);
    const decrypted = service.decrypt(encrypted);
    
    expect(decrypted).toBe(jsonData);
    
    // Verify the decrypted JSON can be parsed
    const parsedData = JSON.parse(decrypted);
    expect(parsedData.name).toBe('John Doe');
    expect(parsedData.preferences.theme).toBe('dark');
  });

  test('should fail to decrypt with wrong key', () => {
    const originalText = 'test data';
    const correctKey = 'correct-key';
    const wrongKey = 'wrong-key';
    
    const correctService = new EncryptionService(correctKey);
    const wrongService = new EncryptionService(wrongKey);
    const encrypted = correctService.encrypt(originalText);
    
    expect(() => {
      wrongService.decrypt(encrypted);
    }).toThrow();
  });

  test('should fail to decrypt invalid encrypted data', () => {
    const invalidEncrypted = 'invalid-encrypted-data';
    const secretKey = 'any-key';
    const service = new EncryptionService(secretKey);

    expect(() => {
      service.decrypt(invalidEncrypted);
    }).toThrow();
  });
});