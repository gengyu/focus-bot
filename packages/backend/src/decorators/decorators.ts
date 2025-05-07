import 'reflect-metadata';
import Router from 'koa-router';
import {ResultHelper} from "../routes/routeHelper.ts";
import {type} from "node:os";
import {URL} from "node:url";
import path from 'path';
import fs from 'fs';

export const router = new Router();
import multer from '@koa/multer';

// 配置multer存储
const defaultMulterStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'data/uploads');
    // 确保目录存在
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// @ts-ignore
const fileFilter = (req, file, callback) => {
  // fix problem can't save arabic strings
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  callback(null, true);
};

// const upload = multer({ storage: storage });

// 示例路由
// router.post('/upload', upload.single('file'), async (ctx) => {
//   ctx.body = ResultHelper.success({ file: ctx.request.file });
// });

// Upload装饰器实现
export interface UploadOptions {
  multiple?: boolean;          // 是否支持多文件上传
  maxSize?: number;           // 最大文件大小（字节）
  fileFilter?: (file: any) => boolean; // 文件过滤函数
  dest?: string;              // 自定义上传目录
  filename?: (file: any) => string; // 自定义文件名生成函数
  limits?: {                  // multer限制选项
    fieldNameSize?: number;   // 字段名大小限制
    fieldSize?: number;       // 字段值大小限制
    fields?: number;          // 非文件字段数量限制
    fileSize?: number;        // 文件大小限制
    files?: number;           // 文件数量限制
  }
}

/**
 * 文件上传装饰器
 * @param fieldName 文件字段名，默认为'file'
 * @param options 上传选项
 * @returns 方法装饰器
 */
export function Upload(fieldName: string = 'file', options: UploadOptions = {}): MethodDecorator {
  return (target, propertyKey: string | symbol) => {
    const controllerClass = target.constructor;
    if (!Reflect.hasMetadata('upload_config', controllerClass)) {
      Reflect.defineMetadata('upload_config', {}, controllerClass);
    }
    
    const uploadConfig = Reflect.getMetadata('upload_config', controllerClass);
    uploadConfig[propertyKey] = {
      fieldName,
      multiple: options.multiple || false,
      maxSize: options.maxSize,
      fileFilter: options.fileFilter,
      dest: options.dest,
      filename: options.filename,
      limits: options.limits
    };
    
    Reflect.defineMetadata('upload_config', uploadConfig, controllerClass);
  };
}


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
  return function (path: string): MethodDecorator {
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
    existingParams.push({index: parameterIndex, key});
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
    existingParams.push({index: parameterIndex, key});
    //@ts-ignore
    Reflect.defineMetadata('body_params', existingParams, target, propertyKey);
  };
}

export function Param(key?: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    //@ts-ignore
    const existingParams = Reflect.getOwnMetadata('route_params', target, propertyKey) || [];
    existingParams.push({index: parameterIndex, key});
    //@ts-ignore
    Reflect.defineMetadata('route_params', existingParams, target, propertyKey);
  };
}

// todo  修改缓存位置
const newMap = new Map();

// 修改registerControllers以支持参数注入
export function registerControllers(controllers: any[]) {
  controllers.forEach(ControllerClass => {
    const prefix = Reflect.getMetadata('prefix', ControllerClass) || '';
    const routes = Reflect.getMetadata('routes', ControllerClass) || [];
    const uploadConfig = Reflect.getMetadata('upload_config', ControllerClass) || {};
    const instance = new ControllerClass();
    routes.forEach((route: any) => {
      const fullPath = prefix + route.path;

      // @ts-ignore
      if (route.method === 'sse') {

        router.post(fullPath, async (ctx: any, next: any) => {
          const token = new Date().getTime().toString() + Math.random().toString(36).substring(2);
          const handler = instance[route.handler];

          const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
          const queryParams = Reflect.getMetadata('query_params', instance, route.handler) || [];
          const bodyParams = Reflect.getMetadata('body_params', instance, 'postMessage') || [];
          const routeParams = Reflect.getMetadata('route_params', instance, route.handler) || [];
          const args = [];

          for (let i = 0; i < handler.length; i++) {
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
          newMap.set(token, {args})
          const requrl = `${ctx.protocol}://${ctx.host}${ctx.url}?token=${token}`;
          ctx.body = ResultHelper.success({url: requrl});
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
            const [abort, result]: [() => void, ReadableStream] = await handler.apply(instance, parsm.args);
            const reader = result.getReader();

            // 监听客户端关闭连接事件
            // 因为当ctx.res.end()被调用后，连接关闭，Node.js会自动清理相关的事件监听器。此外，由于这是一次性的事件监听，当连接关闭时，监听器会自然失效，不会造成内存泄漏。所以当前的实现方式是合适的。
            ctx.req.on('close', () => {
              abort(); // 调用cancel函数清理资源
              reader.releaseLock();
              ctx.res.end();
            });

            try {
              while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                ctx.res.write(`data: ${typeof value === 'string' ? value : JSON.stringify(value)}\n\n`);
              }
            } catch (error) {
              ctx.res.end();
            } finally {
              reader.releaseLock();
            }
          } catch (error) {
            console.error('SSE处理错误:', error);
            ctx.res.write(`event: error\ndata: ${JSON.stringify({error: '处理流数据时发生错误'})}\n\n`);
            ctx.res.end();
          } finally {
            ctx.res.write('event: end\ndata: Stream ended\n\n');
            ctx.res.end();
          }

        });
      } else {
        // 检查是否有上传配置
        const uploadConfig = Reflect.getMetadata('upload_config', ControllerClass) || {};
        const methodUploadConfig = uploadConfig[route.handler];
        
        if (methodUploadConfig) {
          // 如果有上传配置，创建自定义的multer实例
          const fieldName = methodUploadConfig.fieldName || 'file';
          const isMultiple = methodUploadConfig.multiple || false;
          
          // 创建自定义的multer配置
          const multerOptions: any = {};
          
          // 配置存储
          if (methodUploadConfig.dest || methodUploadConfig.filename) {
            multerOptions.storage = multer.diskStorage({
              destination: function (req, file, cb) {
                const uploadDir = methodUploadConfig.dest || path.join(process.cwd(), 'uploads');
                // 确保目录存在
                fs.mkdirSync(uploadDir, { recursive: true });
                cb(null, uploadDir);
              },
              filename: function (req, file, cb) {
                if (methodUploadConfig.filename && typeof methodUploadConfig.filename === 'function') {
                  cb(null, methodUploadConfig.filename(file));
                } else {
                  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                  cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
                }
              }
            });
          }else {
            multerOptions.storage = defaultMulterStorage;
          }
          
          // 配置文件大小限制
          if (methodUploadConfig.maxSize || methodUploadConfig.limits) {
            multerOptions.limits = methodUploadConfig.limits || {};
            if (methodUploadConfig.maxSize) {
              multerOptions.limits.fileSize = methodUploadConfig.maxSize;
            }
          }
          
          // 配置文件过滤器
          if (methodUploadConfig.fileFilter && typeof methodUploadConfig.fileFilter === 'function') {
            // @ts-ignore
            multerOptions.fileFilter = (req, file, cb) => {
              cb(null, methodUploadConfig.fileFilter(file));
            };
          }else {
            multerOptions.fileFilter = fileFilter;
          }
          
          // 创建multer实例
          const customUpload = multer(multerOptions);
          
          // 根据是否多文件上传选择不同的multer处理方法
          const uploadMiddleware = isMultiple 
            ? customUpload.array(fieldName) 
            : customUpload.single(fieldName);
          
          //@ts-ignore
          router[route.method](fullPath, uploadMiddleware, async (ctx: any, next: any) => {
            const handler = instance[route.handler];
            const paramTypes = Reflect.getMetadata('design:paramtypes', instance, route.handler) || [];
            const queryParams = Reflect.getMetadata('query_params', instance, route.handler) || [];
            const bodyParams = Reflect.getMetadata('body_params', instance, route.handler) || [];
            const routeParams = Reflect.getMetadata('route_params', instance, route.handler) || [];

            const args = [];
            for (let i = 0; i < handler.length; i++) {
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
            
            // 将上传的文件信息添加到ctx.request.body中
            if (isMultiple && ctx.request.files) {
              ctx.request.body = ctx.request.body || {};
              ctx.request.body[fieldName] = ctx.request.files;
            } else if (ctx.request.file) {
              ctx.request.body = ctx.request.body || {};
              ctx.request.body[fieldName] = ctx.request.file;
            }
            
            const result = await handler.apply(instance, args);
            if (result !== undefined) {
              ctx.body = result;
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
            for (let i = 0; i < handler.length; i++) {
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
      }
    });
  });
}
