import { PerformanceMonitor } from './types';

/**
 * 性能监控实现
 * @class PerformanceMonitorImpl
 * @implements {PerformanceMonitor}
 */
export class PerformanceMonitorImpl implements PerformanceMonitor {
  private operations: Map<string, { start: number; end?: number }> = new Map();

  startOperation(name: string): void {
    this.operations.set(name, { start: Date.now() });
  }

  endOperation(name: string): void {
    const operation = this.operations.get(name);
    if (operation) {
      operation.end = Date.now();
    }
  }

  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.operations.forEach((operation, name) => {
      if (operation.end) {
        metrics[name] = operation.end - operation.start;
      }
    });
    return metrics;
  }
}