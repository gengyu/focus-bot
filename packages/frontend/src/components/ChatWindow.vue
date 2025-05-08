<template>
  <div class="flex flex-1 flex-col rounded-xl ">
    <!-- 消息列表区域 -->
    <div class="flex-1 px-6 pt-4 pb-30" ref="messageContainer">

      <div v-for="(message, index) in chatMessages" :key="index" class="mb-6">
        <MessageBubble v-if="message" :chatMessage="message" :index="index"/>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class=" bg-white border-b border-[#e5e7eb] sticky bottom-4 shadow-[0_2px_4px_rgba(0,0,0,0.04)]
    border-t mb px-4 py-3 rounded-xl ring-1 ring-transparent
    focus-within:ring-blue-500 focus-within:ring-opacity-50 focus-within:shadow-[0_2px_8px_rgba(37,99,235,0.15)] transition-all duration-200">


      <!-- 图片预览区域 -->
      <div v-if="previewImages.length > 0" class="mb-3 flex flex-wrap items-center gap-2">
        <div v-for="(preview, index) in previewImages" :key="index" class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
          <img :src="preview" alt="图片预览" class="w-full h-full object-cover cursor-pointer" @click="(e) => showImg(index, e)">
          <button @click="removeImage(index)"
                  class="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 文件预览区域 -->
      <div v-if="fileNames.length > 0" class="mb-3 flex flex-wrap items-center gap-2">
        <div v-for="(fileName, index) in fileNames" :key="index" class="relative px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-sm text-gray-700">{{ fileName }}</span>
          <button @click="removeFile(index)"
                  class="ml-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 文件上传进度条 -->
        <div v-if="fileUploadProgress > 0" class="w-full mt-2">
          <div class="text-xs text-gray-500 mb-1">文件解析进度</div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: fileUploadProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 图片预览弹窗 -->
      <vue-easy-lightbox
          :visible="showLightbox"
          :imgs="previewImages"
          :index="currentImgIndex"
          @hide="showLightbox = false"
      ></vue-easy-lightbox>

      <!-- 输入框区域 -->
      <div>
        <!-- 服务商选择 -->
        <!--        <select v-model="selectedProvider" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">-->
        <!--          <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>-->
        <!--        </select>-->
        <!-- 模型选择 -->
        <!--        <select v-if="!props.model" v-model="selectedModel" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">-->
        <!--          <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>-->
        <!--        </select>-->
        <!-- 文本输入框 -->


        <!--          bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors overflow-y-auto-->
        <div ref="editableDiv"
             contenteditable="true"
             class="editableDiv min-h-[72px] max-h-[200px] w-full px-4 py-2.5  focus:outline-none"
             :class="{'empty-content': !messageInput}"
             @input="handleInput"
             @keydown.enter.prevent="handleEnterKey"
             @paste.prevent="handlePaste"
             @compositionstart="isComposing = true"
             @compositionend="isComposing = false"
        ></div>
        <div class="flex justify-between">
          <!-- 功能按钮区 -->
          <div class=" bottom-2 left-3 flex items-center gap-2">
            <!-- 搜索按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isSearchActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleSearch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isSearchActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <!-- 推理按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isReasoningActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleReasoning"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isReasoningActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </button>
            <!-- 图片上传按钮 -->
            <label
                class="p-1.5 rounded-lg transition-colors cursor-pointer"
                :class="[isImageUploadActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
            >
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isImageUploadActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </label>

            <!-- 文件上传按钮 -->
            <label
                class="p-1.5 rounded-lg transition-colors cursor-pointer"
                :class="[isFileUploadActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
            >
              <input type="file" accept=".pdf,.doc,.docx,.txt,.csv,.json,.xml" class="hidden" @change="handleFileUpload">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isFileUploadActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </label>

          </div>
          <!--          <div class="text-xs text-gray-400 mt-1 text-right">按   Enter 发送</div>-->

          <!-- 发送按钮 -->
          <div class="flex items-center gap-2">
            <!-- 语音输入按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isVoiceInputActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleVoiceInput"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isVoiceInputActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </button>
            <button @click="isLoading ? stopMessage() : sendMessage()"
                    class="px-6 py-2.5 rounded-lg focus:outline-none transition-colors self-end"
                    :class="[isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white']"
            >
              <span v-if="!isLoading">发送</span>
              <span v-else class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    停止
                </span>
            </button>
          </div>

        </div>

      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, defineProps, ref, watch} from 'vue';
import type {ChatMessage, Model} from "../../../../share/type.ts";
import log from "loglevel";
import {useConversationStore} from "../store/conversationStore.ts";
import {useMessageStore} from "../store/messageStore.ts";
import MessageBubble from './MessageBubble.vue';
import {toast} from "vue-sonner";
import VueEasyLightbox from 'vue-easy-lightbox';
import {chatAPI} from "../services/chatApi.ts";


// // 配置MarkdownIt实例
// const md = new MarkdownIt({
//   typographer: true,
//   highlight: function (str, lang) {
//     if (lang && hljs.getLanguage(lang)) {
//       try {
//         return hljs.highlight(str, {language: lang}).value;
//       } catch (__) {
//       }
//     }
//     return ''; // 使用额外的默认转义
//   }
// });
// md.use(markdownItKatex);

// 使用对话管理Store
const dialogStore = useConversationStore();
const messageStore = useMessageStore();

const props = defineProps<{
  model?: Model
  chatId?: string
  // chatMessages?: ChatMessage[]
}>();


const chatMessages = computed(() => {
  return messageStore.messages[props.chatId]?.filter(Boolean)
});


const messageInput = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const editableDiv = ref<HTMLElement>();
const imagePreview = ref<string | null>(null);
const imageFileName = ref<string>('');
const imageFiles = ref<File[]>([]);
const previewImages = ref<string[]>([]);
const showLightbox = ref(false);
const currentImgIndex = ref(0);

// 文件上传相关
const fileFiles = ref<File[]>([]);
const fileNames = ref<string[]>([]);
const fileUploadProgress = ref<number>(0);
const isFileUploading = ref<boolean>(false);

const isLoading = ref(false);
const isComposing = ref(false); // 是否正在输入法编辑状态

// 功能开关状态
const isSearchActive = ref(false);
const isReasoningActive = ref(false);
const isVoiceInputActive = ref(false);
const isImageUploadActive = ref(false);
const isFileUploadActive = ref(false);

// 处理输入框内容变化
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement;
  messageInput.value = target.innerText.trim();
};

// 处理Enter键事件
const handleEnterKey = (event: KeyboardEvent) => {
  console.log('enter')
  if (event.altKey || event.shiftKey || event.metaKey || isComposing.value) return
  // 如果是组合键或正在输入法编辑状态，则插入换行
  if (event.ctrlKey) {
    document.execCommand('insertLineBreak');
    return;
  }
  // 单独按下Enter键且不在输入法编辑状态时，发送消息
  sendMessage();
};

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
};

// 功能切换方法
const toggleSearch = () => {
  isSearchActive.value = !isSearchActive.value;
  // TODO: 实现搜索功能
};

const toggleReasoning = () => {
  isReasoningActive.value = !isReasoningActive.value;
  // TODO: 实现推理功能
};

const toggleVoiceInput = () => {
  isVoiceInputActive.value = !isVoiceInputActive.value;
  // TODO: 实现语音输入功能
};

// 服务商与模型相关
const providers = ref<{ id: string, name: string, models: string[] }[]>([]);
const selectedProvider = ref('');

const availableModels = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value);
  return p ? p.models : [];
});


const stopMessage = ()=> {
  if (isLoading.value) {// 如果正在发送消息，则不允许再次发送
    messageStore.stopMessage(props.chatId || '')
  }
}

// 发送消息
const sendMessage = async () => {
  // 检查是否有内容可发送
  if (!messageInput.value.trim() && !imageFiles.value.length && !fileFiles.value.length) return;

  if (!messageInput.value.trim() && !imageFiles.value.length) return;
  if (isLoading.value) {// 如果正在发送消息，则不允许再次发送
    return
  }

  isLoading.value = true; // 设置loading状态

  try {
    // 发送消息到服务器
    const model = props.model;
    if (!model) {
      console.error('未选择模型');
      toast.warning('未选择模型');
      isLoading.value = false; // 重置loading状态
      return;
    }
    const chatId = props.chatId || '';

    // 处理文件上传和解析
    let fileContent = '';
    if (fileFiles.value.length > 0) {
      try {
        // 显示文件上传进度
        fileUploadProgress.value = 30;
        toast.info('正在解析文件，请稍候...');

        // 依次解析所有文件
        for (const file of fileFiles.value) {
          const result = await messageStore.parseFile(file);
          fileUploadProgress.value = 70;

          if (result && result.content) {
            // 将解析结果添加到消息内容中
            fileContent += `\n文件 ${file.name} 解析结果:\n${result.content}\n`;
          }
        }

        fileUploadProgress.value = 100;
        toast.success('文件解析完成');
      } catch (error) {
        console.error('文件解析失败:', error);
        toast.error('文件解析失败: ' + (error instanceof Error ? error.message : String(error)));
        fileUploadProgress.value = 0;
      }
    }

    // 创建用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageInput.value.trim() + (fileContent ? fileContent : ''),
      timestamp: Date.now(),
      type: 'text',
      images: imageFiles.value.length > 0 ? imageFiles.value : undefined,
      files: fileFiles.value.length > 0 ? fileFiles.value : undefined
    };
    
    // 将消息添加到消息列表中，确保在UI中显示
    if (!messageStore.messages[chatId]) {
      messageStore.messages[chatId] = [];
    }
    messageStore.messages[chatId].push(userMessage);

    // 清空输入框、图片和文件
    if (editableDiv.value) {
      editableDiv.value.innerText = '';
    }
    messageInput.value = '';
    imageFiles.value = [];
    previewImages.value = [];
    isImageUploadActive.value = false;
    fileFiles.value = [];
    fileNames.value = [];
    isFileUploadActive.value = false;
    fileUploadProgress.value = 0;

    // 使用对话管理器发送消息
    // 确保在发送消息前已经将用户消息添加到消息列表中
    const readableStream = await messageStore.sendMessage(userMessage.content as string, model, chatId);

    const reader = readableStream.getReader();
    while (true) {
      const {done,} = await reader.read();
      if (done) {
        break;
      }
      scrollToBottom();
    }
    console.log('done')

  } catch (error) {
    console.error('发送消息失败:', error);
    toast.error('发送消息失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    isLoading.value = false; // 无论成功还是失败，都重置loading状态
  }

  // 滚动到底部
  scrollToBottom();
};


// 检查文件大小
// if (file.size > maxFileSize) {
//   toast.error(`文件 ${file.name} 超过10MB限制`);
//   return;
// }
const maxFileSize = 10 * 1024 * 1024; // 10MB限制

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  Array.from(input.files).forEach(file => {
    imageFiles.value.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImages.value.push(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });

  isImageUploadActive.value = true;
  // 清除input的value，允许上传相同的文件
  input.value = '';
};

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  Array.from(input.files).forEach(file => {
    // 确保文件对象包含所需属性
    const fileObj = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
    fileFiles.value.push(fileObj);
    fileNames.value.push(file.name);
  });

  isFileUploadActive.value = true;
  // 清除input的value，允许上传相同的文件
  input.value = '';

  // 显示上传的文件名到输入框
  if (fileNames.value.length > 0) {
    const fileText = `已选择文件: ${fileNames.value.join(', ')}`;
    if (editableDiv.value) {
      editableDiv.value.innerText = fileText;
      messageInput.value = fileText;
    }
  }
};



// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};


const removeImage = (index: number) => {
  imageFiles.value.splice(index, 1);
  previewImages.value.splice(index, 1);
  if (previewImages.value.length === 0) {
    isImageUploadActive.value = false;
  }
};

const removeFile = (index: number) => {
  fileFiles.value.splice(index, 1);
  fileNames.value.splice(index, 1);
  if (fileNames.value.length === 0) {
    isFileUploadActive.value = false;
    if (editableDiv.value) {
      editableDiv.value.innerText = '';
      messageInput.value = '';
    }
  } else {
    // 更新输入框显示的文件名
    const fileText = `已选择文件: ${fileNames.value.join(', ')}`;
    if (editableDiv.value) {
      editableDiv.value.innerText = fileText;
      messageInput.value = fileText;
    }
  }
};

const showImg = (index: number, e?: Event) => {
  currentImgIndex.value = index;
  showLightbox.value = true;
  // 防止事件冒泡
  e?.stopPropagation();
};

// 发送消息时处理图片上传
const handleImageMessage = async () => {
  if (!imageFiles.value || imageFiles.value.length === 0) return;

  try {
    // 图片已经在sendMessage函数中处理，这里只需要滚动到底部
    scrollToBottom();
  } catch (error) {
    log.error("处理图片消息失败:", error);
    toast.error('处理图片失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// 清除图片上传预览
const cancelImageUpload = () => {
  imageFiles.value = [];
  previewImages.value = [];
  isImageUploadActive.value = false;
};


// 定义emit事件
const emit = defineEmits<{
  (e: 'scroll'): void
}>();

// 滚动到底部
const scrollToBottom = () => {

  // 发送滚动事件给父组件
  emit('scroll');

};


</script>

<style scoped>

.think-process {
  opacity: 0.85;
  font-size: 14px;
}

.think-process .text-gray-600 {
  line-height: 1.5;
}

.empty-content:empty:before {
  content: '输入消息...';
  color: #9CA3AF;
  position: absolute;
  pointer-events: none;
}

/* 添加文本选中样式 */
#editableDiv::selection {
  background-color: #3b82f6;
  color: white;
}

#editableDiv::-moz-selection {
  background-color: #3b82f6;
  color: white;
}
</style>
