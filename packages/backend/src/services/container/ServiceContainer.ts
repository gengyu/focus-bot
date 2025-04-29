import { EventEmitter } from 'events';

// 服务接口定义
export interface IService {
  initialize?(): Promise<void>;
  dispose?(): Promise<void>;
}

// 服务标识符类型
export type ServiceIdentifier = string | symbol | Function;

// 服务注册选项
export interface ServiceRegistration {
  identifier: ServiceIdentifier;
  implementation: any;
  singleton?: boolean;
  dependencies?: ServiceIdentifier[];
}

// 服务容器类
export class ServiceContainer extends EventEmitter {
  private static instance: ServiceContainer;
  private services: Map<ServiceIdentifier, any> = new Map();
  private singletons: Map<ServiceIdentifier, any> = new Map();
  private registrations: Map<ServiceIdentifier, ServiceRegistration> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // 注册服务
  public register(registration: ServiceRegistration): void {
    this.registrations.set(registration.identifier, registration);
  }

  // 获取服务实例
  public async get<T>(identifier: ServiceIdentifier): Promise<T> {
    const registration = this.registrations.get(identifier);
    if (!registration) {
      throw new Error(`Service not registered: ${identifier.toString()}`);
    }

    if (registration.singleton) {
      const singletonInstance = this.singletons.get(identifier);
      if (singletonInstance) {
        return singletonInstance;
      }
    }

    const instance = await this.createInstance<T>(registration);
    if (registration.singleton) {
      this.singletons.set(identifier, instance);
    }

    return instance;
  }

  // 创建服务实例
  private async createInstance<T>(registration: ServiceRegistration): Promise<T> {
    const dependencies = await this.resolveDependencies(registration.dependencies || []);
    const instance = new registration.implementation(...dependencies);

    if (typeof instance.initialize === 'function') {
      await instance.initialize();
    }

    return instance;
  }

  // 解析依赖
  private async resolveDependencies(dependencies: ServiceIdentifier[]): Promise<any[]> {
    return Promise.all(
      dependencies.map(dependency => this.get(dependency))
    );
  }

  // 释放所有服务
  public async dispose(): Promise<void> {
    for (const [_, instance] of this.singletons) {
      if (typeof instance.dispose === 'function') {
        await instance.dispose();
      }
    }
    this.singletons.clear();
    this.services.clear();
    this.registrations.clear();
  }
}