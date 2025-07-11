import path from 'path';

// 延迟加载transformers以避免启动时的sharp库问题
let transformersModule: any = null;

async function getTransformers() {
  if (!transformersModule) {
    const { pipeline, env } = await import('@xenova/transformers');
    // 设置模型缓存目录
    env.cacheDir = path.join(process.cwd(), '/data/.cache/');
    env.remoteHost = 'https://hf-mirror.com/';
    transformersModule = { pipeline, env };
  }
  return transformersModule;
}

export { getTransformers };

 
