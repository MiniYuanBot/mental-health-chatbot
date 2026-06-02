import type { EmotionAnalysisResult } from '../utils/aiApi';

// 策略模式：定义可替换的情绪分析算法接口
export interface EmotionStrategy {
  analyze(text: string): Promise<EmotionAnalysisResult>;
}