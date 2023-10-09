export interface ChatMessage {
    userId?: number;
    channelId?: number;
    sender?: string;
    text?: string;
    type?: 'text' | 'image';
    content?: string;
    timestamp?: string;
    avatarPath?: string;
}


