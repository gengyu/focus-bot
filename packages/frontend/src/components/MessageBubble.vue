<template>
  <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <!-- AI头像 -->
    <div v-if="message.role !== 'user'"
         class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
      <span class="text-green-600 text-sm">AI</span>
    </div>
    <!-- 消息气泡 -->
    <div class="max-w-[75%] rounded-2xl px-4 py-3"
         :class="message.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white rounded-tl-sm'"
    >
      <!-- AI思考过程 -->
      <div v-if="message.type === 'text' && message.role !== 'user' && message.thinking"
           class="markdown-body think-process break-words">
        <div class="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span class="text-gray-400 text-sm">思考过程</span>
        </div>
        <div class="text-gray-600 bg-gray-50 rounded-lg px-3 pt-3 pb-0.25" v-html="mdRender(message.thinking)"></div>
      </div>
      <!-- 普通消息 -->
      <div v-if="message.type === 'text' && message.role !== 'user'" class="markdown-body break-words"
           v-html="mdRender(message.content)"></div>
      <div v-else-if="message.type === 'text'" class="break-words text-[15px] leading-relaxed">
        {{ message.content }}
      </div>
      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="max-w-sm rounded-lg overflow-hidden">
        <img :src="message.imageUrl" alt="聊天图片" class="w-full">
      </div>
      <!-- 显示上传的图片 -->
      <div v-if="message.images && message.images.length > 0" class="mt-3 flex flex-wrap gap-2">
        <div v-for="(image, index) in message.images" :key="index" class="relative">
          <img 
            :src="getImageSrc(image)" 
            alt="上传图片" 
            class="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer" 
            @click="(e) => showFullImage(image, index, e)"
          >
        </div>
      </div>
      <!-- 显示上传的文件 -->
      <div v-if="message.files && (Array.isArray(message.files) ? message.files.length > 0 : true)" class="mt-3">
        <div v-for="(file, index) in getFilesArray(message.files)" :key="index" class="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center hover:bg-gray-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <div class="flex flex-col flex-1">
            <span class="text-sm font-medium">{{ file.name || '未命名文件' }}</span>
            <span class="text-xs text-gray-500">{{ formatFileSize(file.size || 0) }}</span>
          </div>
        </div>
      </div>
      <!-- 消息时间 -->
      <div class="text-xs mt-1 opacity-60" v-if="message.timestamp">
        {{ new Date(message.timestamp).toLocaleTimeString() }}
      </div>
    </div>
    <!-- 用户头像 -->
    <div v-if="message.role === 'user'"
         class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-3">
      <span class="text-blue-600 text-sm">我</span>
    </div>
  </div>
  
  <!-- 图片预览弹窗 -->
  <vue-easy-lightbox
    :visible="showLightbox"
    :imgs="previewImages"
    :index="currentImgIndex"
    @hide="showLightbox = false"
  ></vue-easy-lightbox>
</template>

<script setup lang="ts">
import {computed, defineProps, ref} from 'vue';
import type {ChatMessage, MessageFile} from '../../../../share/type.ts';
import {mdRender} from "../utils/markdown.ts";
import "github-markdown-css";
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import VueEasyLightbox from 'vue-easy-lightbox';

//  解析 <think>开始 <think/> 结束 方法
const parseThink = (content: string) => {
  const think = content.match(/<think>(.*?)<\/think>/s);
  if (think) {
    return content.replace(think[0], `<span class="text-blue-500">${think[1]}</span>`);
  }
  return content;
}

const props = defineProps<{
  chatMessage: ChatMessage,
  index: number
}>();

// 图片预览相关
const showLightbox = ref(false);
const currentImgIndex = ref(0);
const previewImages = ref<string[]>([]);

// 获取图片源URL
const getImageSrc = (image: any): string => {
  if (typeof image === 'string') {
    return image;
  } else if (image instanceof Uint8Array) {
    // 将Uint8Array转换为Blob并创建URL
    const blob = new Blob([image]);
    return URL.createObjectURL(blob);
  } else if (image instanceof File) {
    // 处理File对象
    return URL.createObjectURL(image);
  } else if (image && typeof image === 'object' && 'url' in image) {
    return image.url as string;
  } else if (image && typeof image === 'object' && 'content' in image && image.content instanceof Uint8Array) {
    const blob = new Blob([image.content]);
    return URL.createObjectURL(blob);
  }
  return '';
};

// 显示全屏图片
const showFullImage = (image: any, index: number, e?: Event) => {
  previewImages.value = [];
  if (props.chatMessage.images && Array.isArray(props.chatMessage.images)) {
    // 确保所有图片都能正确获取URL
    previewImages.value = props.chatMessage.images.map(img => getImageSrc(img));
  } else if (props.chatMessage.images) {
    // 处理单个图片的情况
    previewImages.value = [getImageSrc(image)];
  }
  
  // 确保预览图片数组不为空
  if (previewImages.value.length === 0 && image) {
    previewImages.value = [getImageSrc(image)];
  }
  
  currentImgIndex.value = index;
  showLightbox.value = true;
  
  // 防止事件冒泡
  e?.stopPropagation();
};


// 将文件转换为数组
const getFilesArray = (files: MessageFile | MessageFile[] | File | File[] | undefined): MessageFile[] => {
  if (!files) return [];
  
  // 转换为数组处理
  const filesArray = Array.isArray(files) ? files : [files];
  
  // 将File对象转换为MessageFile格式
  return filesArray.map(file => {
    if (file instanceof File) {
      return {
        name: file.name,
        size: file.size,
        type: file.type
      } as MessageFile;
    }
    return file as MessageFile;
  });
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const message = computed(() => {
  // console.log(props.index);
  const chatMessage = props.chatMessage;
  let content = chatMessage?.content?.trim() ?? ''

  let thinking = ''

  const startWithThink = content?.startsWith('<think>')
  if (startWithThink) {
    content = content.replace('<think>', '')
    const endThinkIndex = content.indexOf('</think>');
    if (endThinkIndex === -1) {
      thinking = content
      content = ''
    } else {
      thinking = content.substring(0, endThinkIndex)
      content = content.substring(endThinkIndex).replace(/<\/think>/g, '')
    }
  }

  // 确保images和files属性正确传递
  const images = chatMessage.images || [];
  const files = chatMessage.files || [];

  return {
    role: chatMessage.role,
    content: content,
    timestamp: chatMessage.timestamp,
    type: chatMessage.type || 'text',
    imageUrl: chatMessage.imageUrl,
    thinking: thinking,
    images: images,
    files: files
  }
})


</script>

<style scoped lang="less">
.markdown-body {
  background-color: transparent;
  font-size: 15px;
  line-height: 1.6;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
}

.markdown-body code {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  padding: 0.2em 0.4em;
  font-size: 85%;
}

.think-process {
  opacity: 0.85;
  font-size: 14px;
}

.think-process .text-gray-600 {
  line-height: 1.5;
}
</style>