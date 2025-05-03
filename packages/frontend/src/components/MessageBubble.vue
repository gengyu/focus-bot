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
</template>

<script setup lang="ts">
import {computed, defineProps} from 'vue';
import type {ChatMessage} from '../../../../share/type.ts';
import {mdRender} from "../utils/markdown.ts";
import "github-markdown-css";
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

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

const message = computed(() => {
  console.log(props.index);
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

  return {
    role: chatMessage.role,
    content: content,
    timestamp: chatMessage.timestamp,
    type: chatMessage.type,
    imageUrl: chatMessage.imageUrl,
    thinking: thinking
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