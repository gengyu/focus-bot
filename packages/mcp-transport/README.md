# MCP Transport

这个包提供了数据与前端传输的桥接功能，支持多种传输方式：

- HTTP 调用
- 命令行调用
- 事件发送监听

## 安装

```bash
npm install @mcp-connect/transport
```

## 使用方法

### 导入

```typescript
import { TransportAdapter, TransportType } from '@mcp-connect/transport';
```

### HTTP 传输

```typescript
const transport = new TransportAdapter(TransportType.HTTP, {
  serverUrl: 'http://your-server',
  apiKey: 'your-api-key'
});

// 直接调用
const response = await transport.invokeDirect({
  tool: 'yourTool',
  payload: { /* 参数 */ }
});

// 流式调用
await transport.invokeStream({
  tool: 'yourTool',
  payload: { /* 参数 */ }
}, {
  onData: (data) => console.log('收到数据:', data),
  onError: (error) => console.error('错误:', error),
  onComplete: () => console.log('完成')
});
```

### 命令行调用

```typescript
const transport = new TransportAdapter(TransportType.COMMAND, {
  commandPath: '/path/to/your/command',
  commandArgs: ['--option', 'value']
});

// 使用方式与HTTP传输相同
```

### 事件传输

```typescript
import { EventEmitter } from 'eventemitter3';
import { EventTransport } from '@mcp-connect/transport';

// 创建事件发射器
const emitter = new EventEmitter();

// 创建事件传输
const eventTransport = new EventTransport({
  namespace: 'myApp',
  emitter
});

// 监听请求
eventTransport.on('request', (request) => {
  console.log('收到请求:', request);
  
  // 处理请求并发送响应
  emitter.emit('myApp:response', {
    success: true,
    data: { result: 'success' }
  });
});

// 创建适配器
const transport = new TransportAdapter(TransportType.EVENT, {
  eventNamespace: 'myApp',
  eventEmitter: emitter
});

// 使用方式与其他传输相同
```

## API 参考

### TransportAdapter

统一的传输适配器，提供一致的接口来使用不同的传输方式。

```typescript
const transport = new TransportAdapter(type, config);
```

- `type`: 传输类型，可选值：`TransportType.HTTP`、`TransportType.COMMAND`、`TransportType.EVENT`
- `config`: 传输配置，根据类型不同而不同

### 传输配置

```typescript
interface TransportConfig {
  // HTTP传输配置
  serverUrl?: string;
  apiKey?: string;
  
  // 命令行传输配置
  commandPath?: string;
  commandArgs?: string[];
  
  // 事件传输配置
  eventNamespace?: string;
  eventEmitter?: EventEmitter;
  
  // 通用配置
  debug?: boolean;
}
```

### 传输方法

```typescript
// 直接调用
const response = await transport.invokeDirect(request);

// 流式调用
await transport.invokeStream(request, options);
```

## 许可证

MIT