import 'reflect-metadata';
import Router from 'koa-router';
import {ResultHelper} from "./routes/routeHelper";

export const router = new Router();

export function Controller(prefix = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}

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

        router.post(fullPath, async (ctx: any, next: any) => {
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
            args[i] = 'ctxxxxxx';
          }

          // 使用缓存，设置请求参数  #todo
          newMap.set(token, {a: 12321, args})
          ctx.body = ResultHelper.success({
            url: `${ctx.request.origin}${fullPath}?token=${token}`,
          });
        });

        router.get(fullPath, async (ctx: any, next: any) => {
          ctx.set('Content-Type', 'text/event-stream');
          ctx.set('Cache-Control', 'no-cache');
          ctx.set('Connection', 'keep-alive');
          ctx.status = 200;
          ctx.res.flushHeaders && ctx.res.flushHeaders();
          const handler = instance[route.handler];

          // handler返回async generator或可迭代对象
          const parsm = newMap.get(ctx.query.token);
          newMap.delete(ctx.query.token);

          const result = await handler.apply(instance, parsm.args);
          ctx.res.write(`data: ${JSON.stringify(parsm)}\n\n`);
          try {
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
          }catch (e) {
            console.log('error=', e);
          } finally {
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
