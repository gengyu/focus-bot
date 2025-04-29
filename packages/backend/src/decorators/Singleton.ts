/**
 * 单例模式装饰器
 * 确保一个类仅有一个实例，并提供一个访问它的全局访问点
 */
export function Singleton() {
    return function <T extends { new(...args: any[]): any }>(constructor: T) {
        let instance: T | null = null;
        const originalConstructor = constructor;

        // 创建一个新的构造函数来包装原始构造函数
        const newConstructor: any = function (...args: any[]) {
            if (!instance) {
                instance = new originalConstructor(...args);
            }
            return instance;
        };

        // 复制原型链
        newConstructor.prototype = originalConstructor.prototype;

        // 返回新的构造函数
        return newConstructor as T;
    };
}