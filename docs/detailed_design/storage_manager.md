# 存储管理模块详细设计

## 1. 模块职责

存储管理模块负责系统数据的持久化存储、缓存管理和备份恢复。该模块确保数据的可靠性、一致性和高效访问，是系统数据管理的核心组件。

## 2. 组件设计

### 2.1 StorageManager

负责数据存储的核心管理：

```typescript
class StorageManager {
  private database: Database;
  private cache: CacheManager;
  private backupManager: BackupManager;

  constructor(
    database: Database,
    cache: CacheManager,
    backupManager: BackupManager
  ) {
    this.database = database;
    this.cache = cache;
    this.backupManager = backupManager;
  }

  async initialize(): Promise<void> {
    await this.database.connect();
    await this.cache.initialize();
    await this.backupManager.initialize();
  }

  async saveData<T>(
    key: string,
    data: T,
    options?: StorageOptions
  ): Promise<void> {
    await this.cache.set(key, data);
    await this.database.save(key, data);

    if (options?.backup) {
      await this.backupManager.backup(key, data);
    }
  }

  async getData<T>(
    key: string,
    options?: FetchOptions
  ): Promise<T | null> {
    // 先从缓存获取
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;

    // 从数据库获取
    const data = await this.database.get<T>(key);
    if (data) {
      await this.cache.set(key, data);
    }

    return data;
  }
}
```

### 2.2 CacheManager

管理系统缓存：

```typescript
class CacheManager {
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : undefined
    };

    this.cache.set(key, entry);
    await this.evictIfNeeded();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() > entry.expiry;
  }

  private async evictIfNeeded(): Promise<void> {
    if (this.cache.size > this.config.maxSize) {
      const entriesToEvict = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.config.maxSize * 0.2));

      entriesToEvict.forEach(([key]) => this.cache.delete(key));
    }
  }
}
```

### 2.3 DatabaseManager

管理SQLite数据库操作：

```typescript
class DatabaseManager implements Database {
  private db: SQLite.Database;
  private migrations: Migration[];

  constructor(migrations: Migration[]) {
    this.migrations = migrations;
  }

  async connect(): Promise<void> {
    this.db = await SQLite.open({
      filename: 'mcp.db',
      driver: SQLite3.Database
    });

    await this.runMigrations();
  }

  async save<T>(key: string, data: T): Promise<void> {
    const serialized = this.serialize(data);
    await this.db.run(
      'INSERT OR REPLACE INTO data (key, value) VALUES (?, ?)',
      [key, serialized]
    );
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.db.get(
      'SELECT value FROM data WHERE key = ?',
      [key]
    );

    return result ? this.deserialize<T>(result.value) : null;
  }

  private async runMigrations(): Promise<void> {
    for (const migration of this.migrations) {
      await this.db.run(migration.up);
    }
  }

  private serialize(data: any): string {
    return JSON.stringify(data);
  }

  private deserialize<T>(data: string): T {
    return JSON.parse(data);
  }
}
```

### 2.4 BackupManager

管理数据备份和恢复：

```typescript
class BackupManager {
  private config: BackupConfig;
  private storage: FileSystem;

  constructor(config: BackupConfig, storage: FileSystem) {
    this.config = config;
    this.storage = storage;
  }

  async backup(key: string, data: any): Promise<void> {
    const backupPath = this.getBackupPath(key);
    const serialized = this.serialize(data);
    await this.storage.writeFile(backupPath, serialized);
  }

  async restore(key: string): Promise<any> {
    const backupPath = this.getBackupPath(key);
    const data = await this.storage.readFile(backupPath);
    return this.deserialize(data);
  }

  private getBackupPath(key: string): string {
    return path.join(
      this.config.backupDir,
      `${key}_${Date.now()}.backup`
    );
  }

  async cleanupOldBackups(): Promise<void> {
    const backups = await this.storage.readdir(this.config.backupDir);
    const oldBackups = this.findOldBackups(backups);
    
    for (const backup of oldBackups) {
      await this.storage.unlink(path.join(this.config.backupDir, backup));
    }
  }
}
```

## 3. 数据模型

### 3.1 数据库模式

```sql
-- 会话表
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT
);

-- 消息表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- 模型配置表
CREATE TABLE model_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  parameters TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- API密钥表
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  usage_stats TEXT
);
```

### 3.2 缓存结构

```typescript
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiry?: number;
  metadata?: Record<string, any>;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
}
```

## 4. 数据操作

### 4.1 事务管理

```typescript
class TransactionManager {
  private db: Database;

  async withTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const tx = await this.db.beginTransaction();
    try {
      const result = await operation(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
```

### 4.2 查询优化

```typescript
class QueryOptimizer {
  private queryCache: Map<string, QueryPlan>;

  optimizeQuery(query: string): QueryPlan {
    const cached = this.queryCache.get(query);
    if (cached) return cached;

    const plan = this.analyzeQuery(query);
    this.queryCache.set(query, plan);
    return plan;
  }

  private analyzeQuery(query: string): QueryPlan {
    // 实现查询分析和优化逻辑
    return {
      indexes: this.identifyIndexes(query),
      joins: this.optimizeJoins(query),
      conditions: this.analyzeConditions(query)
    };
  }
}
```

## 5. 性能优化

### 5.1 缓存优化

```typescript
class CacheOptimizer {
  private hitRates: Map<string, number>;
  private accessPatterns: Map<string, AccessPattern>;

  updateCacheStrategy(): void {
    const patterns = this.analyzePatterns();
    this.adjustCacheSize(patterns);
    this.updateTTLs(patterns);
  }

  private analyzePatterns(): CacheAnalysis {
    return {
      hotKeys: this.identifyHotKeys(),
      coldKeys: this.identifyColdKeys(),
      accessFrequency: this.calculateFrequency()
    };
  }

  private adjustCacheSize(analysis: CacheAnalysis): void {
    const totalMemory = process.memoryUsage().heapUsed;
    const optimalSize = this.calculateOptimalSize(totalMemory, analysis);
    this.cache.resize(optimalSize);
  }
}
```

### 5.2 索引优化

```typescript
class IndexOptimizer {
  private queryStats: QueryStatistics;

  async optimizeIndexes(): Promise<void> {
    const analysis = this.analyzeQueryPatterns();
    const recommendations = this.generateRecommendations(analysis);
    await this.applyRecommendations(recommendations);
  }

  private analyzeQueryPatterns(): IndexAnalysis {
    return {
      frequentQueries: this.identifyFrequentQueries(),
      commonConditions: this.analyzeConditions(),
      joinPatterns: this.analyzeJoins()
    };
  }
}
```

## 6. 数据安全

### 6.1 加密管理

```typescript
class EncryptionManager {
  private key: CryptoKey;
  private algorithm: string;

  async encrypt(data: any): Promise<string> {
    const serialized = JSON.stringify(data);
    const encrypted = await crypto.subtle.encrypt(
      this.algorithm,
      this.key,
      new TextEncoder().encode(serialized)
    );
    return Buffer.from(encrypted).toString('base64');
  }

  async decrypt(encrypted: string): Promise<any> {
    const buffer = Buffer.from(encrypted, 'base64');
    const decrypted = await crypto.subtle.decrypt(
      this.algorithm,
      this.key,
      buffer
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

### 6.2 访问控制

```typescript
class AccessController {
  private permissions: Map<string, Permission[]>;

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const userPerms = this.permissions.get(userId) || [];
    return userPerms.some(perm =>
      perm.resource === resource && perm.actions.includes(action)
    );
  }

  async grantPermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    const userPerms = this.permissions.get(userId) || [];
    userPerms.push(permission);
    this.permissions.set(userId, userPerms);
  }
}
```

## 7. 监控和日志

### 7.1 性能监控

```typescript
interface StorageMetrics {
  queryLatency: number;
  cacheHitRate: number;
  diskUsage: number;
  transactionRate: number;
  errorRate: number;
}

class MetricsCollector {
  private metrics: StorageMetrics[];

  recordMetrics(metric: StorageMetrics): void {
    this.metrics.push(metric);
    this.reportMetrics(metric);
  }

  private reportMetrics(metric: StorageMetrics): void {
    // 实现指标上报逻辑
  }
}
```

### 7.2 日志记录

```typescript
class StorageLogger {
  private logLevel: LogLevel;
  private logFile: string;

  async log(level: LogLevel, message: string, data?: any): Promise<void> {
    if (level >= this.logLevel) {
      const entry = this.formatLogEntry(level, message, data);
      await this.writeLog(entry);
    }
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  }
}
```

## 8. 测试策略

### 8.1 单元测试

```typescript
describe('StorageManager', () => {
  let manager: StorageManager;
  let mockDb: MockDatabase;
  let mockCache: MockCacheManager;

  beforeEach(() => {
    mockDb = new MockDatabase();
    mockCache = new MockCacheManager();
    manager = new StorageManager(mockDb, mockCache);
  });

  test('should save data', async () => {
    const data = { id: '1', value: 'test' };
    await manager.saveData('test-key', data);
    
    const saved = await manager.getData('test-key');
    expect(saved).toEqual(data);
  });

  test('should use cache', async () => {
    const data = { id: '1', value: 'test' };
    await manager.saveData('test-key', data);
    
    const cached = await mockCache.get('test-key');
    expect(cached).toEqual(data);
  });
});
```

### 8.2 集成测试

```typescript
describe('Storage Integration', () => {
  let system: StorageSystem;

  beforeAll(async () => {
    system = await StorageSystem.init();
  });

  test('full storage flow', async () => {
    const data = createTestData();
    await system.save('test-key', data);
    
    const retrieved = await system.get('test-key');
    expect(retrieved).toEqual(data);
  });

  test('backup and restore', async () => {
    const data = createTestData();
    await system.backup('test-key', data);
    
    await system.clear('test-key');
    await system.restore('test-key');
    
    const restored = await system.get('test-key');
    expect(restored).toEqual(data);
  });
});
```