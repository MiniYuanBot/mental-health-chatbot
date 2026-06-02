import type { Emotion, RiskLevel } from '../utils/emotion';

export type EmotionEventData = {
  userText: string;
  emotion: Emotion;
  score: number;
  riskLevel: RiskLevel;
  aiReply: string;
};

// 观察者模式：定义情绪分析完成后的通知接口
export interface EmotionObserver {
  update(data: EmotionEventData): void | Promise<void>;
}