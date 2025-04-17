import { Context, Middleware } from 'koa';
import { HTTPTransport, HTTPTransportConfig } from './transports/HTTPTransport';

interface KoaHTTPTransportOptions  {
  /**
   * 自定义分发规则函数，可根据请求内容动态决定分发逻辑
   */
  dispatchRule?: (ctx: Context, request: any) => Promise<{ handled: boolean } | void>;
  router?:Map<string, Function>
  /**
   * 是否开启日志
   */
  enableLog?: boolean;
  /**
   * 鉴权配置，如token校验、白名单等
   */
  auth?: {
    type?: 'token' | 'basic' | 'custom';
    token?: string;
    whitelist?: string[];
    customValidator?: (ctx: Context, request: any) => Promise<boolean>;
  };
}

export function createKoaHTTPTransportMiddleware(options: KoaHTTPTransportOptions): Middleware {

  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      if(ctx.method === 'POST' &&( ctx.path === '/invoke' ||  ctx.path === '/invoke/stream' ) ){

        // 鉴权处理
        if (options.auth) {
          let authed = true;
          if (options.auth.type === 'token') {
            const token = ctx.headers['authorization'] || ctx.query.token;
            authed = token === options.auth.token;
          } else if (options.auth.type === 'custom' && typeof options.auth.customValidator === 'function') {
            authed = await options.auth.customValidator(ctx, ctx.request.body);
          }
          if (!authed) {
            ctx.status = 401;
            ctx.body = { success: false, error: 'Unauthorized' };
            return;
          }
        }
        // 日志处理
        if (options.enableLog) {
          console.log(`[KoaHTTPTransport] ${ctx.method} ${ctx.path}`, ctx.request.body);
        }
        const request = ctx.request.body;
          const playload = request.playload
          const method = request.method
        if( options?.router?.get(method)){
          const res = await options.router.get(method)(playload)
          ctx.status = 200;
          ctx.body = { success: false, error: '', data: res };
        }else {
          ctx.status = 404;
          ctx.body = { success: false, error: 'Method not found', data: null };
        }

        // // 自定义分发规则
        // if (typeof options.dispatchRule === 'function') {
        //   // 负载
        //   const request = ctx.request.body;
        //   const playload = request.playload
        //   const method = request.method
        //   const result = await options.dispatchRule(method, playload);
        //   if (result && result.handled) {
        //     return;
        //   }
        //   return
        // }
        // const request = ctx.request.body;
        // // 新增：根据method分发到不同后端接口
        // if (request && request.method === 'sendMessage') {

      }
      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  };
}