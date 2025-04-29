import {defineStore} from 'pinia';
import {type Ref, ref} from 'vue';
import type {AppSetting, ProviderConfig} from '../../../../share/type';
import {configAPI} from "../services/api.ts";
import {toast} from "vue-sonner";
import log from "loglevel";

// 默认供应商配置

const getDefaultProviders = (): ProviderConfig[] => {
  return [
    {
      id: 'ollama',
      name: 'Ollama',
      enabled: true,
      apiUrl: 'http://localhost:11434',
      apiKey: '',
      models: [
        {providerId: 'ollama',id: 'llama2', name: 'Llama 2', description: '开源大语言模型', size: '7B', enabled: true},
        {providerId: 'ollama',id: 'codellama', name: 'Code Llama', description: '代码专用模型', size: '7B', enabled: true},
        {providerId: 'ollama',id: 'mistral', name: 'Mistral', description: '高性能开源模型', size: '7B', enabled: true}
      ]
    },
    {
      id: 'openai',
      name: 'OpenAI',
      enabled: false,
      apiUrl: 'https://api.openai.com/v1',
      apiKey: '',
      models: [
        {providerId: 'openai',id: 'gpt-4', name: 'GPT-4', description: '最强大的 GPT 模型', size: '1.76T', enabled: true},
        {providerId: 'openai',id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '性能均衡模型', size: '175B', enabled: true}
      ]
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      enabled: false,
      apiUrl: 'https://generativelanguage.googleapis.com',
      apiKey: '',
      models: [
        {providerId: 'gemini',id: 'gemini-pro', name: 'Gemini Pro', description: '通用型大语言模型', size: '1.37T', enabled: true},
        {providerId: 'gemini',id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: '多模态模型', size: '1.37T', enabled: true}
      ]
    },
    {
      id: 'kimi',
      name: 'Kimi',
      enabled: false,
      apiUrl: 'https://api.moonshot.cn/v1',
      apiKey: '',
      models: [
        {providerId: 'kimi',id: 'moonshot-v1', name: 'Moonshot', description: '通用大语言模型', size: '70B', enabled: true}
      ]
    },
    {
      id: 'doubao',
      name: '豆包',
      enabled: false,
      apiUrl: 'https://api.doubao.com/v1',
      apiKey: '',
      models: [
        {providerId: 'doubao',id: 'doubao-v1', name: '豆包大模型', description: '通用大语言模型', size: '70B', enabled: true}
      ]
    },
    {
      id: 'aliyun',
      name: '阿里云通义千问',
      enabled: false,
      apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
      apiKey: '',
      models: [
        {providerId: 'aliyun',id: 'qwen-max', name: 'Qwen Max', description: '最强性能模型', size: '189B', enabled: true},
        {providerId: 'aliyun',id: 'qwen-plus', name: 'Qwen Plus', description: '通用大语言模型', size: '14B', enabled: true},
        {providerId: 'aliyun',id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速响应模型', size: '7B', enabled: true}
      ]
    }
  ];
};

export const useAppSettingStore = defineStore<string, {
  providerConfig: Ref<AppSetting>,
  resetSettings(): Promise<void>,
  updateProvider(providerId: string, newProvider: Partial<ProviderConfig>): Promise<void>
  // providerConfig: Ref<ProviderConfig>,
  // setProviders: (newProviders: Provider[]) => void,
  // resetProviders: () => void
}>('provider', () => {
  const appSettingConfig = ref<AppSetting>({
    providers: []
  });

  const loadSettings = async () => {
    try {
      // 初始化供应商列表
      const defaultProviders = getDefaultProviders();

      // providerConfig.value.providers = JSON.parse(JSON.stringify(defaultProviders));

      // 从后端加载用户配置
      const config = await configAPI.getModelConfig();
      if (config && config.providers) {
        appSettingConfig.value.providers = defaultProviders.map(provider => {
          const savedProvider = config.providers?.find(p => p.id === provider.id);
          if (savedProvider) {
            return {
              ...provider,
              enabled: savedProvider.enabled,
              apiUrl: savedProvider.apiUrl,
              apiKey: savedProvider.apiKey,
              models: savedProvider.models
            };
          }
          return provider;
        });
      }
    } catch (error) {
      appSettingConfig.value.providers = getDefaultProviders()
      log.error("Failed to load settings:", error);
      toast.error('加载设置失败');
    }
  }

  loadSettings();

  const resetSettings = async () => {
    if (confirm('确定要重置所有设置吗？')) {
      // const apiUrl = getDefaultApiUrl(modelId);
      // const models = getDefaultModels(modelId);
      // providers.value = providers.value.map(provider => ({
      //   ...provider,
      //   enabled: provider.id === 'ollama',
      //   apiUrl: getDefaultApiUrl(provider.id),
      //   apiKey: '',
      //   models: provider.models.map(model => ({ ...model, enabled: true }))
      // }));
      await saveSettings();
    }
  };

  // 保存模型
  const saveSettings = async () => {
    try {

      await configAPI.saveModelConfig(appSettingConfig.value);
      toast.success('设置已保存');
    } catch (error) {
      log.error("Failed to save settings:", error);
      toast.error(`保存设置失败: ${error}`);
    }
  };

  const updateProvider = async (providerId: string, newProvider: ProviderConfig) => {
    appSettingConfig.value.providers = appSettingConfig.value.providers?.map(provider => {
      if (provider.id === providerId) {
        return {
          ...provider,
          ...newProvider,
          providerId,
        };
      }
      return provider;
    });
    await saveSettings();
  };

  return {
    providerConfig: appSettingConfig,
    resetSettings,
    updateProvider,
  };
});