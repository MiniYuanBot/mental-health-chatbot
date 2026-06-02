import type { EmotionEventData, EmotionObserver } from './emotionObserver';

// 观察者模式：高风险情绪出现时广播危机事件
export class CrisisAlertObserver implements EmotionObserver {
  update(data: EmotionEventData): void {
    if (data.riskLevel === 'high') {
      window.dispatchEvent(new CustomEvent('crisis-warning', { detail: data }));
    }
  }
}