import { LogLevel, VectorizationLog, LogHandler } from './types';

/**
 * 控制台日志处理器
 * @class ConsoleLogHandler
 * @implements {LogHandler}
 */
export class ConsoleLogHandler implements LogHandler {
  handle(log: VectorizationLog): void {
    const timestamp = log.timestamp.toISOString();
    const metadata = JSON.stringify(log.metadata);
    console.log(`[${timestamp}] ${log.level.toUpperCase()}: ${log.message} ${metadata}`);
  }
}

/**
 * 日志管理器
 * @class LogManager
 */
export class LogManager {
  private handlers: LogHandler[] = [];

  constructor() {
    // 默认添加控制台处理器
    this.addHandler(new ConsoleLogHandler());
  }

  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  log(level: LogLevel, message: string, metadata: Record<string, any> = {}): void {
    const log: VectorizationLog = {
      level,
      message,
      metadata,
      timestamp: new Date()
    };

    this.handlers.forEach(handler => handler.handle(log));
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
}