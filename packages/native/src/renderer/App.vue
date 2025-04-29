<template>
  <v-app :theme="theme">
    <v-app-bar>
      <v-app-bar-title>{{ $t('welcome') }}</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <!-- 语言切换 -->
      <v-btn
        icon
        @click="toggleLanguage"
      >
        <v-icon>{{ currentLocale === 'zh-CN' ? 'mdi-translate' : '中' }}</v-icon>
      </v-btn>
      
      <!-- 主题切换 -->
      <v-btn
        icon
        @click="toggleTheme"
      >
        <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

// 主题状态
const theme = ref('light');

// 国际化
const { locale } = useI18n();
const currentLocale = ref(locale.value);

// 切换主题
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

// 切换语言
const toggleLanguage = () => {
  const newLocale = currentLocale.value === 'zh-CN' ? 'en' : 'zh-CN';
  locale.value = newLocale;
  currentLocale.value = newLocale;
};
</script>