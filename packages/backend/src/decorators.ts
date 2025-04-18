import 'reflect-metadata';
import Router from 'koa-router';
import {ResultHelper} from "./routes/routeHelper.ts";

export const router = new Router();

export function Controller(prefix = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}

function createMethodDecorator(method: 'get' | 'post' | 'put' | 'delete') {
  return function(path: string): MethodDecorator {
    return (target, propertyKey: string | symbol) => {
      const controllerClass = target.constructor;
      if (!Reflect.hasMetadata('routes', controllerClass)) {
        Reflect.defineMetadata('routes', [], controllerClass);
      }
      const routes = Reflect.getMetadata('routes', controllerClass) as any[];
      routes.push({
        method,
        path,
        handler: propertyKey
      });
      Reflect.defineMetadata('routes', routes, controllerClass);
    };
  };
}

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');

// SSE装饰器实现
export function SSE(path: string): MethodDecorator {
  return (target, propertyKey: string | symbol) => {
    const controllerClass = target.constructor;
    if (!Reflect.hasMetadata('routes', controllerClass)) {
      Reflect.defineMetadata('routes', [], controllerClass);
    }
    const routes = Reflect.getMetadata('routes', controllerClass) as any[];
    routes.push({
      method: 'get',
      path,
      handler: propertyKey,
      sse: true
    });
    Reflect.defineMetadata('routes', routes, controllerClass);
  };
}

// 参数装饰器实现
export function Query(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingParams = Reflect.getOwnMetadata('query_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    Reflect.defineMetadata('query_params', existingParams, target, propertyKey);
  };
}

export function Body(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingParams = Reflect.getOwnMetadata('body_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    Reflect.defineMetadata('body_params', existingParams, target, propertyKey);
  };
}

export function Param(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingParams = Reflect.getOwnMetadata('route_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    Reflect.defineMetadata('route_params', existingParams, target, propertyKey);
  };
}

// 修改registerControllers以支持参数注入
export function registerControllers(controllers: any[]) {
  controllers.forEach(ControllerClass => {
    const prefix = Reflect.getMetadata('prefix', ControllerClass) || '';
    const routes = Reflect.getMetadata('routes', ControllerClass) || [];
    const instance = new ControllerClass();
    routes.forEach((route: any) => {
      const fullPath = prefix + route.path;
      // @ts-ignore
      if (route.sse) {
        router.get(fullPath, async (ctx: any, next: any) => {
          ctx.set('Content-Type', 'text/event-stream');
          ctx.set('Cache-Control', 'no-cache');
          ctx.set('Connection', 'keep-alive');
          ctx.status = 200;
          ctx.res.flushHeaders && ctx.res.flushHeaders();
          const handler = instance[route.handler];
          const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
          const queryParams = Reflect.getOwnMetadata('query_params', instance, route.handler) || [];
          const bodyParams = Reflect.getOwnMetadata('body_params', instance, route.handler) || [];
          const routeParams = Reflect.getOwnMetadata('route_params', instance, route.handler) || [];
          const args = [];
          for (let i = 0; i < paramTypes.length; i++) {
            const routeParam = routeParams.find((p: any) => p.index === i);
            if (routeParam) {
              args[i] = routeParam.key ? ctx.params?.[routeParam.key] : ctx.params;
              continue;
            }
            const queryParam = queryParams.find((p: any) => p.index === i);
            if (queryParam) {
              args[i] = queryParam.key ? ctx.query?.[queryParam.key] : ctx.query;
              continue;
            }
            const bodyParam = bodyParams.find((p: any) => p.index === i);
            if (bodyParam) {
              args[i] = bodyParam.key ? ctx.request.body?.[bodyParam.key] : ctx.request.body;
              continue;
            }
            args[i] = ctx;
          }
          // handler返回async generator或可迭代对象
          const result = await handler.apply(instance, args);
          if (result && typeof result[Symbol.asyncIterator] === 'function') {
            for await (const data of result) {
              ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
          } else if (result && typeof result[Symbol.iterator] === 'function') {
            for (const data of result) {
              ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
          } else {
            ctx.res.write(`data: ${JSON.stringify(result)}\n\n`);
          }
          ctx.res.end();
        });
      } else {
        router[route.method](fullPath, async (ctx: any, next: any) => {
          const handler = instance[route.handler];
          const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
          const queryParams = Reflect.getOwnMetadata('query_params', instance, route.handler) || [];
          const bodyParams = Reflect.getOwnMetadata('body_params', instance, route.handler) || [];
          const routeParams = Reflect.getOwnMetadata('route_params', instance, route.handler) || [];
          const args = [];
          for (let i = 0; i < paramTypes.length; i++) {
            // 优先级：路由参数 > Query > Body > ctx
            const routeParam = routeParams.find((p: any) => p.index === i);
            if (routeParam) {
              args[i] = routeParam.key ? ctx.params?.[routeParam.key] : ctx.params;
              continue;
            }
            const queryParam = queryParams.find((p: any) => p.index === i);
            if (queryParam) {
              args[i] = queryParam.key ? ctx.query?.[queryParam.key] : ctx.query;
              continue;
            }
            const bodyParam = bodyParams.find((p: any) => p.index === i);
            if (bodyParam) {
              args[i] = bodyParam.key ? ctx.request.body?.[bodyParam.key] : ctx.request.body;
              continue;
            }
            // 默认注入ctx
            args[i] = ctx;
          }
          const result = await handler.apply(instance, args);
          if (result !== undefined) {
            ctx.body = result;
          }
        });
      }
    });
  });
}