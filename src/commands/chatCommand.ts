import type { ChatMessage } from '../utils/storage';

export interface ChatCommand {
  execute(): ChatMessage[];
  undo(): ChatMessage[];
  getDescription(): string;
}

// 命令模式：把发送用户消息封装为可撤销操作
export class SendMessageCommand implements ChatCommand {
  constructor(
    private readonly message: ChatMessage,
    private readonly beforeMessages: ChatMessage[],
  ) {}

  execute(): ChatMessage[] {
    return [...this.beforeMessages, this.message];
  }

  undo(): ChatMessage[] {
    return this.beforeMessages;
  }

  getDescription(): string {
    return `发送消息：${this.message.content.slice(0, 12)}`;
  }
}