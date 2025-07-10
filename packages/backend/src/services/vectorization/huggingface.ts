import { pipeline, env } from '@xenova/transformers';
import path from 'path';


// 设置模型缓存目录
env.cacheDir =  path.join(process.cwd(), '/data/.cache/')

env.remoteHost = 'https://hf-mirror.com/';

 
