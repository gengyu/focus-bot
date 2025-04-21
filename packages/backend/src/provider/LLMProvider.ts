

export interface ProviderResponseChunk {
    content: string | null,
    reasoningContent: string | null,
    provider: string | null,
    model: string | null
}




export interface LLMProvider {

    chat(messages: Array<{ role: string; content: string }>):Promise<any>;
    streamChat (messages: Array<{ role: string; content: string }>): AsyncGenerator<ProviderResponseChunk, void, unknown>;
    getModels: () => Promise<any>;
}

export interface ProviderConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    baseURL?: string;
}


