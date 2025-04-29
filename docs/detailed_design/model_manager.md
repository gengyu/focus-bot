# 模型接入模块详细设计

## 1. 模块职责

模型接入模块负责管理AI模型的配置、调用和响应处理，是系统与各种LLM模型交互的核心接口层。该模块需要保证模型调用的可靠性、安全性和性能，同时提供灵活的扩展机制以支持新模型的接入。

## 2. 组件设计

### 2.1 ModelRegistry

负责模型配置的注册和管理：

```typescript
class ModelRegistry {
  private models: Map<string, ModelConfig>;
  private defaultModel: string;

  constructor() {
    this.models = new Map();
    this.defaultModel = '';
  }

  registerModel(config: ModelConfig): void {
    this.validateConfig(config);
    this.models.set(config.id, config);
    if (!this.defaultModel) {
      this.defaultModel = config.id;
    }
  }

  private validateConfig(config: ModelConfig): void {
    // 验证模型配置的完整性和正确性
    if (!config.id || !config.name || !config.provider || !config.api_endpoint) {
      throw new ModelError(
        ModelErrorType.VALIDATION_ERROR,
        'Invalid model configuration'
      );
    }
  }

  getModel(modelId: string): ModelConfig {
    const model = this.models.get(modelId);
    if (!model) {
      throw new ModelError(
        ModelErrorType.NOT_FOUND,
        `Model ${modelId} not found`
      );
    }
    return model;
  }
}
```

### 2.2 ApiKeyManager

管理API密钥的存储和使用：

```typescript
class ApiKeyManager {
  private keys: Map<string, ApiKey>;
  private encryptionService: EncryptionService;

  constructor(encryptionService: EncryptionService) {
    this.keys = new Map();
    this.encryptionService = encryptionService;
  }

  async addApiKey(provider: string, key: string): Promise<void> {
    const encryptedKey = await this.encryptionService.encrypt(key);
    this.keys.set(provider, {
      id: generateUUID(),
      provider,
      key: encryptedKey,
      created_at: Date.now(),
      last_used_at: 0,
      usage_stats: {
        requests: 0,
        tokens: 0
      }
    });
  }

  async getApiKey(provider: string): Promise<string> {
    const apiKey = this.keys.get(provider);
    if (!apiKey) {
      throw new ModelError(
        ModelErrorType.AUTH_ERROR,
        `No API key found for provider ${provider}`
      );
    }
    return await this.encryptionService.decrypt(apiKey.key);
  }

  updateUsageStats(provider: string, tokens: number): void {
    const apiKey = this.keys.get(provider);
    if (apiKey) {
      apiKey.usage_stats.requests += 1;
      apiKey.usage_stats.tokens += tokens;
      apiKey.last_used_at = Date.now();
    }
  }
}
```

### 2.3 RequestManager

处理模型API请求的发送和重试：

```typescript
class RequestManager {
  private retryConfig: RetryConfig;
  private apiKeyManager: ApiKeyManager;

  constructor(apiKeyManager: ApiKeyManager, retryConfig?: Partial<RetryConfig>) {
    this.apiKeyManager = apiKeyManager;
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      ...retryConfig
    };
  }

  async sendRequest(request: ModelApiRequest): Promise<ModelApiResponse> {
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount < this.retryConfig.maxRetries) {
      try {
        const response = await this.executeRequest(request);
        this.updateUsageStats(request.model, response.usage);
        return response;
      } catch (error) {
        lastError = error;
        if (!this.shouldRetry(error)) {
          break;
        }
        await this.delay(retryCount);
        retryCount++;
      }
    }

    throw lastError || new Error('Request failed');
  }

  private async executeRequest(request: ModelApiRequest): Promise<ModelApiResponse> {
    const model = this.modelRegistry.getModel(request.model);
    const apiKey = await this.apiKeyManager.getApiKey(model.provider);

    const response = await fetch(model.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new ModelError(
        ModelErrorType.API_ERROR,
        `API request failed: ${response.statusText}`
      );
    }

    return await response.json();
  }

  private shouldRetry(error: any): boolean {
    // 判断错误是否可重试
    return error instanceof ModelError && 
           error.type === ModelErrorType.NETWORK_ERROR;
  }

  private delay(retryCount: number): Promise<void> {
    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(2, retryCount),
      this.retryConfig.maxDelay
    );
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 2.4 ResponseHandler

处理模型响应的解析和流式输出：

```typescript
class ResponseHandler {
  private streamController: StreamController;

  constructor() {
    this.streamController = new StreamController();
  }

  async handleResponse(
    response: Response,
    options: ResponseOptions
  ): Promise<ModelApiResponse> {
    if (options.stream) {
      return this.handleStreamResponse(response);
    }
    return this.handleRegularResponse(response);
  }

  private async handleStreamResponse(
    response: Response
  ): Promise<ModelApiResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ModelError(
        ModelErrorType.STREAM_ERROR,
        'Failed to get response reader'
      );
    }

    let accumulated = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      accumulated += chunk;
      this.streamController.emit('data', chunk);
    }

    return this.parseResponse(accumulated);
  }

  private async handleRegularResponse(
    response: Response
  ): Promise<ModelApiResponse> {
    const data = await response.json();
    return this.parseResponse(data);
  }

  private parseResponse(data: any): ModelApiResponse {
    // 解析和验证响应数据
    return {
      id: data.id,
      choices: data.choices,
      usage: data.usage
    };
  }
}
```

## 3. 数据流设计

### 3.1 请求处理流程

1. 请求初始化
   - 验证请求参数
   - 获取模型配置
   - 准备API密钥

2. 请求发送
   - 构建HTTP请求
   - 执行重试策略
   - 处理响应流

3. 响应处理
   - 解析响应数据
   - 更新使用统计
   - 触发回调事件

### 3.2 模型状态管理

```typescript
interface ModelState {
  status: ModelStatus;
  error: Error | null;
  lastResponse: ModelApiResponse | null;
  usage: ModelUsage;
}

class ModelStateManager {
  private states: Map<string, ModelState>;
  private listeners: Set<(state: ModelState) => void>;

  constructor() {
    this.states = new Map();
    this.listeners = new Set();
  }

  updateState(modelId: string, partial: Partial<ModelState>): void {
    const current = this.states.get(modelId) || this.getInitialState();
    const updated = { ...current, ...partial };
    this.states.set(modelId, updated);
    this.notifyListeners(updated);
  }

  private getInitialState(): ModelState {
    return {
      status: ModelStatus.IDLE,
      error: null,
      lastResponse: null,
      usage: {
        requests: 0,
        tokens: 0
      }
    };
  }
}
```

## 4. 异常处理

### 4.1 错误类型定义

```typescript
enum ModelErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

class ModelError extends Error {
  constructor(
    public type: ModelErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ModelError';
  }
}
```

### 4.2 错误处理策略

1. 验证错误
   - 请求参数验证
   - 模型配置验证
   - API密钥验证

2. 网络错误
   - 自动重试机制
   - 超时处理
   - 降级策略

3. API错误
   - 错误码解析
   - 限流处理
   - 日志记录

## 5. 性能优化

### 5.1 请求优化

```typescript
class RequestOptimizer {
  private cache: RequestCache;
  private rateLimiter: RateLimiter;

  constructor() {
    this.cache = new RequestCache();
    this.rateLimiter = new RateLimiter();
  }

  async optimizeRequest(request: ModelApiRequest): Promise<ModelApiRequest> {
    // 应用请求优化策略
    await this.rateLimiter.acquire();
    const optimized = this.applyOptimizations(request);
    return optimized;
  }

  private applyOptimizations(request: ModelApiRequest): ModelApiRequest {
    // 实现请求优化逻辑
    return {
      ...request,
      messages: this.optimizeMessages(request.messages)
    };
  }

  private optimizeMessages(messages: Message[]): Message[] {
    // 优化消息内容
    return messages.map(msg => ({
      ...msg,
      content: this.optimizeContent(msg.content)
    }));
  }
}
```

### 5.2 响应优化

```typescript
class ResponseOptimizer {
  private streamBuffer: StreamBuffer;

  constructor() {
    this.streamBuffer = new StreamBuffer();
  }

  optimizeStreamResponse(chunk: string): string {
    // 优化流式响应处理
    return this.streamBuffer.process(chunk);
  }

  optimizeRegularResponse(response: ModelApiResponse): ModelApiResponse {
    // 优化普通响应处理
    return {
      ...response,
      choices: this.optimizeChoices(response.choices)
    };
  }
}
```

## 6. 安全措施

### 6.1 API密钥保护

```typescript
class ApiKeyProtection {
  private encryptionKey: CryptoKey;

  async protect(apiKey: string): Promise<string> {
    // 实现API密钥加密
    return await this.encrypt(apiKey);
  }

  private async encrypt(data: string): Promise<string> {
    // 实现加密逻辑
    return data;
  }
}
```

### 6.2 请求安全

```typescript
class RequestSecurity {
  private tokenizer: Tokenizer;

  validateRequest(request: ModelApiRequest): void {
    this.validateContent(request.messages);
    this.validateTokenCount(request.messages);
  }

  private validateContent(messages: Message[]): void {
    // 实现内容安全检查
  }

  private validateTokenCount(messages: Message[]): void {
    // 实现token数量检查
  }
}
```

## 7. 测试策略

### 7.1 单元测试

```typescript
describe('ModelManager', () => {
  let manager: ModelManager;
  let mockApiKey: MockApiKeyManager;

  beforeEach(() => {
    mockApiKey = new MockApiKeyManager();
    manager = new ModelManager(mockApiKey);
  });

  test('should register model', () => {
    const config = createTestModelConfig();
    manager.registerModel(config);
    expect(manager.getModel(config.id)).toEqual(config);
  });

  test('should handle request', async () => {
    const request = createTestRequest();
    const response = await manager.sendRequest(request);
    expect(response.choices).toBeDefined();
  });
});
```

### 7.2 集成测试

```typescript
describe('Model Integration', () => {
  let system: ModelSystem;

  beforeAll(async () => {
    system = await ModelSystem.init();
  });

  test('full request flow', async () => {
    const request = createTestRequest();
    const response = await system.sendRequest(request);
    
    expect(response.status).toBe('success');
    expect(response.choices.length).toBeGreaterThan(0);
  });
});
```

## 8. 监控指标

### 8.1 性能指标

```typescript
interface ModelMetrics {
  requestLatency: number;    // 请求延迟
  tokenProcessingTime: number; // Token处理时间
  streamingSpeed: number;    // 流式传输速度
  errorRate: number;         // 错误率
  usageCount: number;        // 使用次数
}

class MetricsCollector {
  private metrics: ModelMetrics[];

  recordMetrics(metric: ModelMetrics): void {
    this.metrics.push(metric);
    this.reportMetrics(metric);
  }

  private reportMetrics(metric: ModelMetrics): void {
    // 实现指标上报逻辑
  }
}
```

### 8.2 健康检查

```typescript
class ModelHealthChecker {
  private models: Map<string, ModelConfig>;

  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all(
      Array.from(this.models.values()).map(model =>
        this.checkModelHealth(model)
      )
    );

    return {
      healthy: checks.every(c => c.healthy),
      models: checks
    };
  }

  private async checkModelHealth(model: ModelConfig): Promise<ModelHealth> {
    try {
      const response = await this.sendHealthCheck(model);
      return {
        id: model.id,
        healthy: response.ok,
        latency: response.latency
      };
    } catch (error) {
      return {
        id: model.id,
        healthy: false,
        error
      };
    }
  }
}
```