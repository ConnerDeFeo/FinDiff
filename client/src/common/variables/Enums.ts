export enum WebSocketMessageType {
    Chunk = 'chunk',
    Complete = 'complete',
    Error = 'error',
    Update = 'update'
} 

export enum MessageRole {
    User = 'user',
    Assistant = 'assistant'
}