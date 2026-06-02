import type { ChatMessage } from '../utils/storage';

// 备忘录模式：保存聊天消息列表快照
export class ChatMemento {
  constructor(
    public readonly messages: ChatMessage[],
    public readonly savedAt: number = Date.now(),
  ) {}
}