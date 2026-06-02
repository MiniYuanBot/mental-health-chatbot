import { analyzeEmotionWithRemoteApi } from '../utils/aiApi';
import type { EmotionStrategy } from './emotionStrategy';

// 策略模式：真实远程 LLM 情绪分析策略
export class ApiEmotionStrategy implements EmotionStrategy {
  analyze(text: string) {
    return analyzeEmotionWithRemoteApi(text);
  }
}