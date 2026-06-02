import { addEmotionRecord } from '../utils/storage';
import type { EmotionEventData, EmotionObserver } from './emotionObserver';

// 观察者模式：将最近情绪分析结果同步到本地缓存
export class PersistObserver implements EmotionObserver {
  update(data: EmotionEventData): void {
    addEmotionRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      content: data.userText,
      emotion: data.emotion,
      score: data.score,
      riskLevel: data.riskLevel,
      time: new Date().toISOString(),
      analysisSource: 'local',
      analysisModel: 'observer-cache',
    });
  }
}