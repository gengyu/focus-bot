import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  created_at: number;
  updated_at: number;
  metadata?: Record<string, any>;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversationId: null,
  loading: false,
  error: null,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setCurrentConversation(state, action: PayloadAction<string>) {
      state.currentConversationId = action.payload;
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      state.conversations.push(action.payload);
      state.currentConversationId = action.payload.id;
    },
    addMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.messages.push(action.payload.message);
        conversation.updated_at = Date.now();
      }
    },
    deleteConversation(state, action: PayloadAction<string>) {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = state.conversations[0]?.id || null;
      }
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
  setCurrentConversation,
  addConversation,
  addMessage,
  deleteConversation,
  setLoading,
  setError,
} = conversationSlice.actions;

export default conversationSlice.reducer;