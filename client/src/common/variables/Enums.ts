export enum WebSocketMessageType {
    Chunk = 'chunk',
    Complete = 'complete',
    Error = 'error',
    Update = 'update',
    FreeTierLimit = 'free_tier_limit'
} 

export enum MessageRole {
    User = 'user',
    Assistant = 'assistant'
}