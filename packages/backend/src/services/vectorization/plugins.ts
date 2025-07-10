import { VectorizationPlugin } from './types';
import { VectorizationError } from './errors';
import { ErrorCode } from './errors';

/**
 * 插件管理器
 * @class PluginManager
 */
export class PluginManager {
  private plugins: Map<string, VectorizationPlugin> = new Map();

  async register(plugin: VectorizationPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new VectorizationError(`插件 ${plugin.name} 已存在`, ErrorCode.PLUGIN_ALREADY_EXISTS);
    }
    await plugin.initialize();
    this.plugins.set(plugin.name, plugin);
  }

  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.cleanup();
      this.plugins.delete(name);
    }
  }

  getPlugin(name: string): VectorizationPlugin | undefined {
    return this.plugins.get(name);
  }

  async cleanup(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values()).map(plugin => plugin.cleanup())
    );
    this.plugins.clear();
  }
}