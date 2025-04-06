import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from './slices/conversationSlice';
import modelReducer from './slices/modelSlice';

export const store = configureStore({
  reducer: {
    conversation: conversationReducer,
    model: modelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;