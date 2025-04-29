<template>
  <v-container>
    <v-row class="mt-4" justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-center">
            {{ $t('welcome') }}
          </v-card-title>
          <v-card-text>
            <v-row justify="center" class="mt-4">
              <v-col cols="12" sm="6" class="text-center">
                <v-btn
                  color="primary"
                  @click="toggleLanguage"
                >
                  {{ $t('switchLanguage') }}
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" class="text-center">
                <v-btn
                  color="secondary"
                  @click="toggleTheme"
                >
                  {{ $t('switchTheme') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { inject } from 'vue';

const { t, locale } = useI18n();
const toggleTheme = inject('toggleTheme') as () => void;

const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en' : 'zh-CN';
};
</script>