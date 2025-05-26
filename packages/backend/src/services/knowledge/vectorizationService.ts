import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {pipeline, env} from '@xenova/transformers';
import {fileURLToPath} from 'url';
import path from 'path';

// 在 ES Modules 中获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 设置模型缓存目录
// env.cacheDir 用于指定模型文件缓存的根目录。
// 我们将其设置为当前文件所在目录下的 '.cache_models' 文件夹。
// env.cacheDir = path.join(__dirname, 'cache_models');
console.log('env.localModelPath==', env.localModelPath)
// env.localModelPath = __dirname;
// env.remoteHost  = 'https://huggingface.co/';
env.remoteHost = 'https://hf-mirror.com/';

// 类型定义文件
export interface VectorDocument {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, any>;
}

export interface VectorizationOptions {
  knowledgeBaseId: string;
  texts: string[];
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface VectorizationResult {
  status: 'success' | 'error';
  message: string;
  vectorCount?: number;
}

export const appConfig = {
  defaultChunkSize: 1000,
  defaultChunkOverlap: 200,
  modelName: 'Xenova/all-MiniLM-L6-v2',
};


// const embedder = pipeline('feature-extraction', appConfig.modelName);

// 向量存储（内存中）
let vectorStore: VectorDocument[] = [];


// 向量化并存储
export async function vectorizeAndStore(options: VectorizationOptions): Promise<VectorizationResult> {
  try {

// // Allocate a pipeline for sentiment-analysis
//     let pipe = await pipeline('sentiment-analysis');
//
//     const out = await pipe('I love transformers!');
//     console.log('out==', out)
// // [{'label': 'POSITIVE', 'score': 0.999817686}]

    const {
      knowledgeBaseId,
      texts,
      chunkSize = appConfig.defaultChunkSize,
      chunkOverlap = appConfig.defaultChunkOverlap
    } = options;

    if (!knowledgeBaseId || !texts || !Array.isArray(texts)) {
      throw new Error('knowledgeBaseId 和 texts 是必填字段，且 texts 必须是数组');
    }

    // 分块
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const documents = [];
    for (const text of texts) {
      const chunks = await splitter.createDocuments([text], [{knowledgeBaseId}]);
      documents.push(...chunks);
    }

    console.log('分块完成，向量化开始...')
    // --- Embedder Instance (Lazy Initialization)  todo ---
    // We'll initialize the embedder only when it's first needed.
    // This prevents immediate download attempts if the service isn't used right away.

    const embedder = await pipeline('feature-extraction', appConfig.modelName, {
      progress_callback: (data: any) => {
        // {
        //   status: 'initiate',
        //     name: 'sentence-transformers/all-MiniLM-L6-v2',
        //   file: 'config.json'
        // }
        console.log(data.status, data.name, data.file)
        // data 对象包含下载进度信息
        // status: 当前状态，如 'download' (下载中), 'ready' (准备好), 'done' (完成)
        // file: 当前正在下载的文件名
        // progress: 下载进度百分比 (0-100)
        // loaded: 已下载字节数
        // total: 总字节数

        if (data.status === 'download') {
          const progress = data.progress ? data.progress.toFixed(2) : '0.00';
          const loadedMB = (data.loaded / (1024 * 1024)).toFixed(2);
          const totalMB = (data.total / (1024 * 1024)).toFixed(2);

          console.log(`Downloading ${data.file}: ${progress}% (${loadedMB}MB / ${totalMB}MB)`);
        } else if (data.status === 'ready') {
          console.log(`Model "${data.file}" is ready.`);
        } else if (data.status === 'done') {
          console.log(`Download of "${data.file}" completed!`);
        } else {
          console.log(`Download status: ${data.status}`);
        }
      },
    });
    console.log('分块完成，向量化开始...')
    // 本地向量化
    const chunkTexts = documents.map(doc => doc.pageContent);
    const vectors = await embedder(chunkTexts, {pooling: 'mean', normalize: true});

    // 存储到内存
    const newVectors: VectorDocument[] = [];
    for (let i = 0; i < documents.length; i++) {
      const vec: VectorDocument = {
        id: `${knowledgeBaseId}-${vectorStore.length + i}`,
        text: documents[i].pageContent,
        vector: vectors[i].data, // SentenceTransformers 返回的向量数据
        metadata: documents[i].metadata,
      };
      vectorStore.push(vec);
      newVectors.push(vec);
    }

    return {
      status: 'success',
      message: '本地向量化完成，存储到内存',
      vectorCount: newVectors.length,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `本地向量化失败: ${(error as Error).message}`,
    };
  }
}

// 获取内存中的向量
export function getVectors(): VectorDocument[] {
  return vectorStore;
}

// 示例使用
export async function TestMain() {
  const options: VectorizationOptions = {
    knowledgeBaseId: 'kb123',
    texts: ['这是一段很长的测试文本...', '另一段测试文本...'],
    chunkSize: 1000,
    chunkOverlap: 200,
  };

  const result: VectorizationResult = await vectorizeAndStore(options);
  console.log(result);

  const vectors = getVectors();
  console.log('内存中的向量数量:', vectors.length);
  vectors.forEach((vec, index) => {
    console.log(`向量 ${index + 1}:`, vec.text.substring(0, 50), '向量维度:', vec.vector.length);
  });
}

// main().catch(err => console.error('主进程错误:', err));