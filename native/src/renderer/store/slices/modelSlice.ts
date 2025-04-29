import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  api_endpoint: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  created_at: number;
  last_used_at: number;
  usage_stats: {
    requests: number;
    tokens: number;
  };
}

interface ModelState {
  models: ModelConfig[];
  apiKeys: ApiKey[];
  currentModelId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  models: [],
  apiKeys: [],
  currentModelId: null,
  loading: false,
  error: null,
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setCurrentModel(state, action: PayloadAction<string>) {
      state.currentModelId = action.payload;
    },
    addModel(state, action: PayloadAction<ModelConfig>) {
      state.models.push(action.payload);
    },
    updateModel(state, action: PayloadAction<{ id: string; config: Partial<ModelConfig> }>) {
      const model = state.models.find(m => m.id === action.payload.id);
      if (model) {
        Object.assign(model, action.payload.config);
      }
    },
    deleteModel(state, action: PayloadAction<string>) {
      state.models = state.models.filter(m => m.id !== action.payload);
      if (state.currentModelId === action.payload) {
        state.currentModelId = state.models[0]?.id || null;
      }
    },
    addApiKey(state, action: PayloadAction<ApiKey>) {
      state.apiKeys.push(action.payload);
    },
    updateApiKey(state, action: PayloadAction<{ id: string; key: Partial<ApiKey> }>) {
      const apiKey = state.apiKeys.find(k => k.id === action.payload.id);
      if (apiKey) {
        Object.assign(apiKey, action.payload.key);
      }
    },
    deleteApiKey(state, action: PayloadAction<string>) {
      state.apiKeys = state.apiKeys.filter(k => k.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentModel,
  addModel,
  updateModel,
  deleteModel,
  addApiKey,
  updateApiKey,
  deleteApiKey,
  setLoading,
  setError,
} = modelSlice.actions;

export default modelSlice.reducer;