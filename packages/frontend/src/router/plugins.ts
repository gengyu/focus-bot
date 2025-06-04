// src/plugins/lastVisitedRoutePlugin.ts

import {
  type Router,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router';

// 扩展 RouteMeta 接口以包含我们的自定义属性
declare module 'vue-router' {
  interface RouteMeta {
    rememberChildRoute?: boolean; // 是否启用记住子路由逻辑
    defaultChildRoute?: string;   // 默认的子路由路径
    rememberChildRouteStorageKey?: string; // 可选：自定义 localStorage 键名
  }
}

/**
 * Vue Router 插件：根据路由配置记住并重定向到上次访问的子路由。
 * 该插件会查找路由配置中带有 `meta.rememberChildRoute: true` 的父路由，
 * 并将其 `meta.defaultChildRoute` 和 `meta.rememberChildRouteStorageKey` 用于逻辑。
 *
 * @param router Vue Router 实例
 */
export const LastVisitedRoutePlugin = (router: Router): void => {
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {

    // 查找当前路由或其父路由中是否配置了 rememberChildRoute: true
    const parentRouteConfig = to.matched.find(
      (record: RouteRecordRaw) => record.meta && record.meta.rememberChildRoute
    );
    const fromParentRouteConfig = from.matched.find(
      (record: RouteRecordRaw) => record.meta && record.meta.rememberChildRoute
    );

    // from.matched

    // 如果没有找到匹配的父路由配置，直接放行
    if (!parentRouteConfig) {
      return next();
    }

    // 从父路由的 meta 配置中获取相关参数
    const parentPath: string = parentRouteConfig.path;
    // const defaultChildRoute: string | undefined = parentRouteConfig.meta?.defaultChildRoute;
    const storageKey: string =
      parentRouteConfig.meta?.rememberChildRouteStorageKey ||
      `lastVisitedRoute_${parentPath.replace(/^\//, '').replace(/\//g, '-')}`;


    // 检查 defaultChildRoute 是否已配置，这是一个必要项
    // if (!defaultChildRoute) {
    //   console.warn(
    //     `[LastVisitedRoutePlugin Warn]: "defaultChildRoute" is required for route "${parentPath}" when "rememberChildRoute" is true in meta.`
    //   );
    //   return next(); // 缺少必要配置，直接放行
    // }

    if (from.path.startsWith(`${parentPath}/`) && to.path === parentPath) {
      localStorage.setItem(storageKey, '')
      return next();
    }

    // 1. 保存子路由路径
    // 如果当前导航的目标路由是父级路径的子路由，并且不是父级路由本身
    if (to.path.startsWith(`${parentPath}/`) && to.path !== parentPath) {
      localStorage.setItem(storageKey, to.fullPath);
    }

    // 2. 处理对父级路径的直接访问
    if (to.path === parentPath) {
      const lastVisitedPath: string | null = localStorage.getItem(storageKey);

      // 如果上次访问的路径存在且是父级路径的子路径，就重定向
      if (lastVisitedPath && lastVisitedPath.startsWith(`${parentPath}/`)) {
        next(lastVisitedPath);
      } else {
        // 否则，重定向到默认的子路径
        // next(defaultChildRoute);
        next();
      }
    } else {
      // 对于其他非目标父级路由的跳转，正常放行
      next();
    }
  });
};