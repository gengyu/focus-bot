
export interface ProviderResponseChunk {
    content: string | null,
    reasoningContent: string | null,
    provider: string | null,
    model: string | null
}


export interface BaseProvider {
    chatCall(messages: Array<{ role: string; content: string }>): AsyncGenerator<ProviderResponseChunk, void, unknown>;
}