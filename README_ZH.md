# MCP 协议开发者工具

本项目旨在使 MCP（模型上下文协议）系统的开发、调试和部署尽可能简单高效。它提供了一个简单的接口用于调用和与 MCP 服务器交互，并提供清晰的流程视图和详细的日志记录，以帮助调试。

## 特性

- **MCP 协议开发**：轻松开发和实现与各种服务的 MCP 协议连接
- **简单调用**：通过最少的设置简化调用 MCP 服务器和 API 的过程
- **清晰的流程可见性**：跟踪和监控整个调用过程，轻松了解幕后发生的事情
- **易于调试**：内置工具帮助调试请求和响应，确保顺利集成和快速故障排除
- **轻松部署**：快速部署和集成来自任何 MCP 仓库的工具和功能，让您专注于手头的任务

## 安装

要安装项目，只需克隆仓库并安装所需的依赖：

```bash
git clone https://github.com/your-username/mcp-protocol-developer.git
cd mcp-protocol-developer
npm install  # 或使用 pip install -r requirements.txt 安装 Python 依赖
```

## 使用方法

1. 在配置文件 `config.json` 中配置 MCP 服务器连接
2. 使用提供的工具和库与 MCP 服务器交互或开发新的服务器
3. 通过详细的日志跟踪每个步骤，确保一切正常运行

使用示例：

```python
from mcp_protocol_developer import MCPClient

client = MCPClient(server_url="http://localhost:5000")
response = client.invoke_tool("send_message", payload={"message": "Hello World"})
print(response)
```

## 调试

要启用调试，请设置 `DEBUG=true` 环境变量。这将提供请求过程中每个步骤的详细日志，包括请求头、负载和响应。

## 贡献

我们欢迎对本项目的贡献！随时可以：
- 提出问题
- 提交拉取请求
- 分享改进建议

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 快速开始

### 基本配置

```typescript
import { MCPClient } from 'mcp-connect';

// HTTP 传输方式
const httpClient = new MCPClient({
  config: {
    serverUrl: 'http://your-server',
    apiKey: 'your-api-key',
    transport: 'http',
    debug: true
  }
});

// 标准输入输出传输方式
const stdioClient = new MCPClient({
  config: {
    transport: 'stdio',
    debug: true
  }
});
```

### 直接调用模式

```typescript
// HTTP 传输方式
const result = await httpClient.invokeTool({
  tool: 'your-tool',
  payload: { /* 你的数据 */ }
}, 'direct');

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('错误:', result.error);
}

// 标准输入输出传输方式
const stdioResult = await stdioClient.invokeTool({
  tool: 'your-tool',
  payload: { /* 你的数据 */ }
}, 'direct');
```

### 流式调用模式

```typescript
// HTTP 传输方式
await httpClient.invokeTool({
  tool: 'your-tool',
  payload: { /* 你的数据 */ }
}, 'stream', {
  onData: (data) => {
    console.log('收到数据:', data);
  },
  onError: (error) => {
    console.error('流错误:', error);
  },
  onComplete: () => {
    console.log('流完成');
  }
});

// 标准输入输出传输方式
await stdioClient.invokeTool({
  tool: 'your-tool',
  payload: { /* 你的数据 */ }
}, 'stream', {
  onData: (data) => {
    console.log('收到数据:', data);
  },
  onError: (error) => {
    console.error('流错误:', error);
  },
  onComplete: () => {
    console.log('流完成');
  }
});
```

### 自定义日志记录器

```typescript
const client = new MCPClient({
  config: {
    serverUrl: 'http://your-server',
    transport: 'http',
    debug: true
  },
  logger: (message: string, level: 'info' | 'debug' | 'error') => {
    // 你的自定义日志实现
    console.log(`[${level}] ${message}`);
  }
});
```

## API 参考

### MCPClient

与 MCP 服务器交互的主要客户端类。

#### 构造函数

```typescript
constructor(options: MCPClientOptions)
```

#### 方法

##### invokeTool

```typescript
invokeTool(
  request: MCPRequest,
  mode: MCPInvocationMode = 'direct',
  streamOptions?: MCPStreamOptions
): Promise<MCPResponse | void>
```

### 类型定义

#### MCPConfig

```typescript
interface MCPConfig {
  serverUrl: string;      // HTTP 传输方式必需
  apiKey?: string;        // HTTP 传输方式可选
  debug?: boolean;        // 启用调试日志
  transport?: 'stdio' | 'http';  // 传输机制
}
```

#### MCPRequest

```typescript
interface MCPRequest {
  tool: string;           // 工具名称
  payload: Record<string, any>;  // 工具参数
}
```

#### MCPResponse

```typescript
interface MCPResponse {
  success: boolean;       // 操作成功状态
  data?: any;            // 响应数据
  error?: string;        // 失败时的错误信息
}
```

#### MCPStreamOptions

```typescript
interface MCPStreamOptions {
  onData?: (data: any) => void;    // 数据处理器
  onError?: (error: Error) => void;  // 错误处理器
  onComplete?: () => void;         // 完成处理器
}
```

## 错误处理

该库为各种场景提供全面的错误处理：

- 网络错误（HTTP 传输方式）
- JSON 解析错误
- 流错误
- 标准输入输出错误

## 开发指南

### 前置条件

- Node.js >= 14
- npm >= 6

### 环境设置

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建库
npm run build
```

### 测试

该库包含对两种传输机制和调用模式的全面测试。 