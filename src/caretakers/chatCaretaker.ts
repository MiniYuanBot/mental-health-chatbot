import { ChatMemento } from '../mementos/chatMemento';

// 备忘录模式：管理聊天快照历史并提供撤销重做
export class ChatCaretaker {
  private mementos: ChatMemento[] = [];
  private current = -1;

  add(memento: ChatMemento): void {
    this.mementos = this.mementos.slice(0, this.current + 1);
    this.mementos.push(memento);
    this.current = this.mementos.length - 1;
  }

  undo(): ChatMemento | null {
    if (this.current <= 0) return null;
    this.current -= 1;
    return this.mementos[this.current] ?? null;
  }

  redo(): ChatMemento | null {
    if (this.current >= this.mementos.length - 1) return null;
    this.current += 1;
    return this.mementos[this.current] ?? null;
  }
}