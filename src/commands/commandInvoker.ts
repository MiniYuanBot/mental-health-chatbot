import type { ChatMessage } from '../utils/storage';
import type { ChatCommand } from './chatCommand';

// 命令模式：集中调度聊天命令历史
export class CommandInvoker {
  private readonly history: ChatCommand[] = [];

  invoke(command: ChatCommand): ChatMessage[] {
    this.history.push(command);
    return command.execute();
  }

  undoLast(): ChatMessage[] | null {
    const command = this.history.pop();
    return command ? command.undo() : null;
  }
}