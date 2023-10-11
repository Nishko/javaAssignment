export interface ChatMessage {
    userId?: string;
    channelId?: string;
    sender?: string;
    text?: string;
    type?: 'text' | 'image';
    content?: string;
    timestamp?: string;
    avatarPath?: string;
}


