import { sendChatMessage, type ApiMessageHistoryItem, type ChatResponse } from '../utils/api';
import { analyzeEmotionWithApi, createApiReply, type EmotionAnalysisResult } from '../utils/aiApi';

// 外观模式：封装 AI 情绪分析、回复生成与后端持久化流程
export class EmotionServiceFacade {
  private static instance: EmotionServiceFacade | null = null;

  static getInstance(): EmotionServiceFacade {
    if (!EmotionServiceFacade.instance) {
      EmotionServiceFacade.instance = new EmotionServiceFacade();
    }
    return EmotionServiceFacade.instance;
  }

  async analyze(text: string): Promise<EmotionAnalysisResult> {
    return analyzeEmotionWithApi(text);
  }

  createReply(text: string, analysis: EmotionAnalysisResult, history: ApiMessageHistoryItem[]): Promise<string> {
    return createApiReply(text, analysis, history);
  }

  persistChat(userText: string, aiReply: string, analysis: EmotionAnalysisResult): Promise<ChatResponse> {
    return sendChatMessage({
      message: userText,
      reply: aiReply,
      emotion: analysis.emotion,
      score: analysis.score,
      riskLevel: analysis.riskLevel,
      analysisSource: analysis.analysisSource,
      analysisModel: analysis.analysisModel,
    });
  }
}