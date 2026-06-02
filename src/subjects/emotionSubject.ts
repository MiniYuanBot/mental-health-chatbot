import type { EmotionEventData, EmotionObserver } from '../observers/emotionObserver';

// 观察者模式：管理情绪事件订阅者并统一通知
export class EmotionSubject {
  private readonly observers = new Set<EmotionObserver>();

  attach(observer: EmotionObserver): void {
    this.observers.add(observer);
  }

  detach(observer: EmotionObserver): void {
    this.observers.delete(observer);
  }

  notify(data: EmotionEventData): void {
    for (const observer of this.observers) {
      void Promise.resolve(observer.update(data)).catch((error: unknown) => {
        console.error('[EmotionSubject] observer failed', error);
      });
    }
  }
}