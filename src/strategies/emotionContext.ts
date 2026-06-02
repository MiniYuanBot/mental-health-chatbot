import type { EmotionAnalysisResult } from '../utils/aiApi';
import type { EmotionStrategy } from './emotionStrategy';

// 策略模式：运行时持有并切换当前情绪分析策略
export class EmotionContext {
  constructor(private strategy: EmotionStrategy) {}

  setStrategy(strategy: EmotionStrategy): void {
    this.strategy = strategy;
  }

  analyze(text: string): Promise<EmotionAnalysisResult> {
    return this.strategy.analyze(text);
  }
}