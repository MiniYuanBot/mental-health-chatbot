export type Emotion =
  | 'anxiety'
  | 'stress'
  | 'depression'
  | 'anger'
  | 'fatigue'
  | 'loneliness'
  | 'positive'
  | 'neutral'
  | 'crisis';

export type RiskLevel = 'low' | 'medium' | 'high';

export type EmotionAnalysis = {
  emotion: Emotion;
  score: number;
  riskLevel: RiskLevel;
};

const keywordMap: Record<Exclude<Emotion, 'neutral'>, string[]> = {
  anxiety: [
    '焦虑',
    '担心',
    '担忧',
    '害怕',
    '恐惧',
    '紧张',
    '慌',
    '心慌',
    '不安',
    '忐忑',
    '坐立不安',
    '怕',
  ],
  stress: [
    '压力',
    '作业',
    '论文',
    '考试',
    '复习',
    'ddl',
    'deadline',
    '绩点',
    'gpa',
    '就业',
    '实习',
    '保研',
    '科研',
    '答辩',
    '赶不完',
    '来不及',
    '任务',
    '太多事',
  ],
  depression: [
    '难过',
    '伤心',
    '低落',
    '沮丧',
    '崩溃',
    '没意义',
    '没有意义',
    '失眠',
    '睡不着',
    '不想动',
    '提不起劲',
    '绝望',
    '撑不住',
    '想哭',
  ],
  anger: ['生气', '愤怒', '烦', '烦死', '讨厌', '气死', '火大', '恼火', '不爽'],
  fatigue: ['累', '好累', '困', '疲惫', '疲劳', '熬夜', '没睡', '睡不够', '没精神', '头昏'],
  loneliness: ['孤独', '孤单', '没人理解', '没有人理解', '一个人', '没人陪', '没人说话', '被孤立'],
  positive: ['开心', '高兴', '顺利', '放松', '轻松', '感谢', '谢谢', '好多了', '还不错', '有希望'],
  crisis: ['自杀', '不想活', '伤害自己', '自残', '死了算了', '想死', '活不下去', '结束生命'],
};

const priority: Emotion[] = [
  'crisis',
  'depression',
  'anxiety',
  'stress',
  'fatigue',
  'loneliness',
  'anger',
  'positive',
];

const negativeIntensifiers = ['非常', '特别', '真的', '很', '太', '一直', '完全', '严重', '快要', '快'];
const mediumRiskEmotions: Emotion[] = ['depression', 'anxiety', 'stress'];

export const emotionLabels: Record<Emotion, string> = {
  anxiety: '焦虑',
  stress: '压力',
  depression: '低落',
  anger: '愤怒',
  fatigue: '疲劳',
  loneliness: '孤独',
  positive: '积极',
  neutral: '平稳',
  crisis: '危机',
};

export const riskLabels: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export function analyzeEmotion(text: string): EmotionAnalysis {
  const normalized = text.toLowerCase().replace(/\s+/g, '');
  const matches = Object.entries(keywordMap)
    .map(([emotion, keywords]) => ({
      emotion: emotion as Exclude<Emotion, 'neutral'>,
      keywords: keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())),
    }))
    .map((item) => ({ ...item, count: item.keywords.length }))
    .filter((item) => item.count > 0);

  if (matches.some((item) => item.emotion === 'crisis')) {
    return { emotion: 'crisis', score: 10, riskLevel: 'high' };
  }

  if (matches.length === 0) {
    return { emotion: 'neutral', score: 3, riskLevel: 'low' };
  }

  const strongest = matches.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return priority.indexOf(a.emotion) - priority.indexOf(b.emotion);
  })[0];

  const hasIntensifier = negativeIntensifiers.some((keyword) => normalized.includes(keyword));
  const multiEmotionBonus = matches.length > 1 ? 1 : 0;
  const lengthBonus = text.length > 50 ? 1 : 0;
  const emotionBase = strongest.emotion === 'positive' ? 4 : 5;
  const score = Math.min(
    10,
    emotionBase + strongest.count * 2 + Number(hasIntensifier) + multiEmotionBonus + lengthBonus,
  );
  const riskLevel: RiskLevel = mediumRiskEmotions.includes(strongest.emotion) || score >= 8 ? 'medium' : 'low';

  return {
    emotion: strongest.emotion,
    score,
    riskLevel,
  };
}
