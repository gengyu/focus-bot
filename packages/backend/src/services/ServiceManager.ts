import { ServiceContainer } from './container/ServiceContainer';
import { PersistenceServiceFactory } from './persistence/PersistenceServiceFactory';
import { Service } from './container/decorators';

@Service('serviceManager')
export class ServiceManager {
  private container: ServiceContainer;

  constructor() {
    this.container = ServiceContainer.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      // 注册核心服务
      this.registerCoreServices();

      // 初始化所有已注册的服务
      await this.initializeServices();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private registerCoreServices(): void {
    // 注册持久化服务工厂
    this.container.register({
      identifier: 'persistenceServiceFactory',
      implementation: PersistenceServiceFactory,
      singleton: true
    });

    // 在这里注册其他核心服务
  }

  private async initializeServices(): Promise<void> {
    // 获取并初始化持久化服务工厂
    const persistenceFactory = await this.container.get<PersistenceServiceFactory>('persistenceServiceFactory');

    // 在这里初始化其他服务
  }

  async dispose(): Promise<void> {
    await this.container.dispose();
  }

  getContainer(): ServiceContainer {
    return this.container;
  }
}