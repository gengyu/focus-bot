import { ServiceContainer, ServiceIdentifier } from './ServiceContainer';

// 服务注册装饰器
export function Service(identifier?: ServiceIdentifier) {
  return function (target: Function) {
    const serviceId = identifier || target;
    ServiceContainer.getInstance().register({
      identifier: serviceId,
      implementation: target,
      singleton: true
    });
    return target;
  };
}

// 依赖注入装饰器
export function Inject(identifier: ServiceIdentifier) {
  return function (target: any, propertyKey: string) {
    const container = ServiceContainer.getInstance();
    
    Object.defineProperty(target, propertyKey, {
      get: () => {
        return container.get(identifier);
      }
    });
  };
}

// 自动装配装饰器
export function Autowired() {
  return function (target: any, propertyKey: string) {
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    const container = ServiceContainer.getInstance();

    Object.defineProperty(target, propertyKey, {
      get: () => {
        return container.get(type);
      }
    });
  };
}

// 异步初始化装饰器
export function AsyncInit() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`Failed to initialize service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    };

    return descriptor;
  };
}