import { analyzeEmotion } from '../utils/emotion';
import type { EmotionStrategy } from './emotionStrategy';

// 策略模式：本地关键词降级情绪分析策略
export class LocalEmotionStrategy implements EmotionStrategy {
  async analyze(text: string) {
    return {
      ...analyzeEmotion(text),
      analysisSource: 'local' as const,
      analysisModel: 'local-keyword-fallback',
    };
  }
}