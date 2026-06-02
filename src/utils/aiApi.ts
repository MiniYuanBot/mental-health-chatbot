import {
  analyzeEmotion,
  emotionLabels,
  type Emotion,
  type EmotionAnalysis,
  type RiskLevel,
} from './emotion';
import { createMockReply } from './mockAI';

export const AI_API_KEY = import.meta.env.VITE_AI_API_KEY ?? '';
export const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4';
export const AI_MODEL = import.meta.env.VITE_AI_MODEL ?? 'glm-4-flash';

type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type EmotionAnalysisResult = EmotionAnalysis & {
  analysisSource: 'api' | 'local';
  analysisModel: string;
};

function hasApiConfig() {
  return AI_API_KEY.trim().length > 0 && AI_BASE_URL.trim().length > 0;
}

function getChatCompletionEndpoint() {
  return `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`;
}

function createFallbackAnalysis(text: string): EmotionAnalysisResult {
  return {
    ...analyzeEmotion(text),
    analysisSource: 'local',
    analysisModel: 'local-keyword-fallback',
  };
}

function normalizeEmotion(value: unknown): Emotion {
  const emotion = String(value ?? '').trim().toLowerCase();
  const allowed: Emotion[] = [
    'anxiety',
    'stress',
    'depression',
    'anger',
    'fatigue',
    'loneliness',
    'positive',
    'neutral',
    'crisis',
  ];
  return allowed.includes(emotion as Emotion) ? (emotion as Emotion) : 'neutral';
}

function normalizeRiskLevel(value: unknown, emotion: Emotion, score: number): RiskLevel {
  const riskLevel = String(value ?? '').trim().toLowerCase();
  if (riskLevel === 'low' || riskLevel === 'medium' || riskLevel === 'high') {
    return riskLevel;
  }
  if (emotion === 'crisis') return 'high';
  if (emotion === 'depression' || score >= 8) return 'medium';
  return 'low';
}

function clampScore(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(10, Math.max(1, Math.round(numeric)));
}

function parseJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();
  const matched = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(matched ? matched[0] : cleaned) as {
    emotion?: unknown;
    score?: unknown;
    riskLevel?: unknown;
    risk_level?: unknown;
  };
}

function createSystemPrompt(analysis: EmotionAnalysis) {
  return [
    '你是“北大心晴助手”，用于课程 Demo 的 AI 心理健康陪伴与情绪支持系统。',
    '请用中文回复，语气温和、尊重、支持性强。',
    '不要进行医学诊断，不要声称能治疗心理疾病，不要替代专业心理咨询或医疗帮助。',
    '回复应先共情，再给出 2 到 4 个简短、可执行的建议。',
    '如果用户存在自伤或自杀风险，必须明确建议立即联系身边可信任的人、辅导员、学校心理咨询中心或当地紧急求助电话，并建议不要独处。',
    `前端情绪识别结果：${emotionLabels[analysis.emotion]}，强度 ${analysis.score}/10，风险等级 ${analysis.riskLevel}。`,
  ].join('\n');
}

export async function createApiReply(
  text: string,
  analysis: EmotionAnalysis,
  history: ApiMessage[],
) {
  if (!hasApiConfig()) {
    return createMockReply(text, analysis);
  }

  const endpoint = getChatCompletionEndpoint();
  const messages: ApiMessage[] = [
    { role: 'system', content: createSystemPrompt(analysis) },
    ...history.slice(-10),
    { role: 'user', content: text },
  ];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || createMockReply(text, analysis);
  } catch (error) {
    console.warn('AI API failed, fallback to mock reply.', error);
    return `${createMockReply(text, analysis)}\n\n（Demo 提示：真实 API 调用失败，已自动使用本地 mock 回复。请检查 API Key、Base URL、模型名或浏览器 CORS 设置。）`;
  }
}

export async function analyzeEmotionWithApi(text: string): Promise<EmotionAnalysisResult> {
  if (!hasApiConfig()) {
    return createFallbackAnalysis(text);
  }

  try {
    const response = await fetch(getChatCompletionEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0,
        max_tokens: 160,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              '你是情绪识别分类器，只输出严格 JSON，不要输出解释。',
              '根据用户文本识别 emotion、score、risk_level。',
              'emotion 只能是 anxiety, stress, depression, anger, fatigue, loneliness, positive, neutral, crisis 之一。',
              'score 是 1 到 10 的整数，表示情绪强度或困扰强度。',
              'risk_level 只能是 low, medium, high。',
              '如果文本表达自伤、自杀、想死、不想活、伤害自己等含义，emotion 必须为 crisis，risk_level 必须为 high，score 必须为 10。',
              '如果文本表达失恋、难受、伤心、崩溃、绝望、失眠、撑不住等，不能判为 neutral。',
              '输出格式示例：{"emotion":"depression","score":7,"risk_level":"medium"}',
            ].join('\n'),
          },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Emotion API request failed: ${response.status}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Emotion API returned empty content.');
    }

    const parsed = parseJsonObject(content);
    const emotion = normalizeEmotion(parsed.emotion);
    const score = emotion === 'crisis' ? 10 : clampScore(parsed.score);
    const riskLevel =
      emotion === 'crisis' ? 'high' : normalizeRiskLevel(parsed.riskLevel ?? parsed.risk_level, emotion, score);

    return {
      emotion,
      score,
      riskLevel,
      analysisSource: 'api',
      analysisModel: AI_MODEL,
    };
  } catch (error) {
    console.warn('Emotion API failed, fallback to local analysis.', error);
    return createFallbackAnalysis(text);
  }
}