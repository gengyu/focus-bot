import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type {ChatMessage} from "../../../../share/type.ts";
type Delta = ChatCompletionChunk.Choice.Delta;

export interface ProviderResponseChunk extends Delta {
    content: string | null;
    reasoningContent: string | null;
    // provider: string;
    model: string;
    role: 'developer' | 'system' | 'user' | 'assistant' | 'tool';
    timestamp?: number;
    error?: string;
}




export interface LLMProvider {

    chat(message: ChatMessage[], modelId: string, signal?: AbortSignal):Promise<any>;
    streamChat (message: ChatMessage[], modelId: string, signal?: AbortSignal): AsyncGenerator<ProviderResponseChunk, void, unknown>;
    getModels: () => Promise<any>;
}

// export interface ProviderConfig {
//     apiKey: string;
//     model?: string;
//     temperature?: number;
//     maxTokens?: number;
//     baseURL?: string;
// }
//
//
