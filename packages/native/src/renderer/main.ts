import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHashHistory } from 'vue-router';
import vuetify from './plugins/vuetify';
import App from './App.vue';

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/Home.vue')
    }
  ]
});

// 创建i18n实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    'zh-CN': {
      welcome: '欢迎使用MCP客户端'
    },
    'en': {
      welcome: 'Welcome to MCP Client'
    }
  }
});

// 创建Vue应用实例
const app = createApp(App);

// 使用插件
app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(vuetify);

// 挂载应用
app.mount('#app');