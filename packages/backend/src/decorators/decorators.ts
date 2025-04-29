import 'reflect-metadata';
import Router from 'koa-router';
import {ResultHelper} from "../routes/routeHelper.ts";

export const router = new Router();

export function Controller(prefix = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}

// export function Service(): ClassDecorator {
//   return (target: any) => {
//     // Mark the class as a service
//     Reflect.defineMetadata('isService', true, target);
//
//     // 添加单例逻辑
//     const originalConstructor = target;
//     let instance: any;
//
//     // 重写构造函数
//     const newConstructor: any = function (...args: any[]) {
//       if (!instance) {
//         instance = new originalConstructor(...args);
//       }
//       return instance;
//     };
//
//     // 复制原型链
//     newConstructor.prototype = originalConstructor.prototype;
//
//     // 返回新的构造函数
//     return newConstructor;
//   };
// }

function createMethodDecorator(method: 'get' | 'post' | 'put' | 'delete' | 'sse') {
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
export const SSE = createMethodDecorator('sse');

// Design-time type annotations
// function Type(type) { return Reflect.metadata("design:type", type); }
// function ParamTypes(...types) { return Reflect.metadata("design:paramtypes", types); }
// function ReturnType(type) { return Reflect.metadata("design:returntype", type); }

// 参数装饰器实现
export function Query(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    //@ts-ignore
    const existingParams = Reflect.getOwnMetadata('query_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    //@ts-ignore
    Reflect.defineMetadata('query_params', existingParams, target, propertyKey);
  };
}



export function Body(key?: string): ParameterDecorator {
// target: 类的原型（对于实例方法）或构造函数（对于静态方法）。        target.constructor,
// propertyKey: 方法的名称（字符串或符号）。
// parameterIndex: 参数在方法参数列表中的索引（从 0 开始）。
  return (target, propertyKey, parameterIndex) => {
    //@ts-ignore
    const existingParams = Reflect.getOwnMetadata('body_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    //@ts-ignore
    Reflect.defineMetadata('body_params', existingParams,  target, propertyKey);
  };
}

export function Param(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    //@ts-ignore
    const existingParams = Reflect.getOwnMetadata('route_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, key });
    //@ts-ignore
    Reflect.defineMetadata('route_params', existingParams, target, propertyKey);
  };
}

const newMap = new Map();

// 修改registerControllers以支持参数注入
export function registerControllers(controllers: any[]) {
  controllers.forEach(ControllerClass => {
    const prefix = Reflect.getMetadata('prefix', ControllerClass) || '';
    const routes = Reflect.getMetadata('routes', ControllerClass) || [];
    const instance = new ControllerClass();
    routes.forEach((route: any) => {
      const fullPath = prefix + route.path;

      // @ts-ignore
      if (route.method === 'sse') {

        router.post(fullPath, async (ctx:any, next: any) => {
          const token = new Date().getTime().toString() + Math.random().toString(36).substring(2);


          const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
          const queryParams = Reflect.getMetadata('query_params', instance, route.handler) || [];
          const bodyParams = Reflect.getMetadata('body_params', instance, 'postMessage') || [];
          const routeParams = Reflect.getMetadata('route_params', instance, route.handler) || [];
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
            args[i] = '';
          }

          // 使用缓存，设置请求参数  #todo
          newMap.set(token, { args})
          ctx.body = ResultHelper.success({
            url: `${ctx.request.origin}${fullPath}?token=${token}`,
          });
        });

        router.get(fullPath, async (ctx, next: any) => {
          ctx.set('Content-Type', 'text/event-stream');
          ctx.set('Cache-Control', 'no-cache');
          ctx.set('Connection', 'keep-alive');
          ctx.status = 200;
          ctx.res.flushHeaders && ctx.res.flushHeaders();
          const handler = instance[route.handler];

          // handler返回async generator或可迭代对象
          const parsm = newMap.get(ctx.query.token);
          newMap.delete(ctx.query.token);

          try {
            const result: ReadableStream = await handler.apply(instance, parsm.args);
            // if (result.locked) {
            //   throw new Error('Stream is already locked');
            // }
            const reader = result.getReader();
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 将二进制数据转换为字符串
                // const text = new TextDecoder().decode(value);
                // 发送SSE格式的数据
                ctx.res.write(`data: ${value}\n\n`);
              }
            } finally {
              reader.releaseLock();
            }
          } catch (error) {
            console.error('SSE处理错误:', error);
            ctx.res.write(`event: error\ndata: ${JSON.stringify({ error: '处理流数据时发生错误' })}\n\n`);
            ctx.res.end();
          } finally {
            ctx.res.write('event: end\ndata: Stream ended\n\n');
            ctx.res.end();
          }

        });
      } else {
        //@ts-ignore
        router[route.method](fullPath, async (ctx: any, next: any) => {
          const handler = instance[route.handler];
          const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
          const queryParams = Reflect.getMetadata('query_params', instance, route.handler) || [];
          const bodyParams = Reflect.getMetadata('body_params', instance, route.handler) || [];
          const routeParams = Reflect.getMetadata('route_params', instance, route.handler) || [];

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
