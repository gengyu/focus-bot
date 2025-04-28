import type { ChatCompletionChunk } from "openai/resources/chat/completions";
type Delta = ChatCompletionChunk.Choice.Delta;

export interface ProviderResponseChunk extends Delta {
    content: string | null;
    reasoningContent: string | null;
    provider: string;
    model: string;
    role: 'developer' | 'system' | 'user' | 'assistant' | 'tool';
    timestamp?: number;
    error?: string;
}




export interface LLMProvider {

    chat(messages: Array<{ role: string; content: string }>):Promise<any>;
    streamChat (messages: Array<{ role: string; content: string }>): AsyncGenerator<ProviderResponseChunk, void, unknown>;
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
