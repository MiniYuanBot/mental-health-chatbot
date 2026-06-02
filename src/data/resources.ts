import type { Emotion, RiskLevel } from '../utils/emotion';

export type Resource = {
  title: string;
  desc: string;
  tags: Emotion[];
  levels: RiskLevel[];
  urgent?: boolean;
};

export const resources: Resource[] = [
  {
    title: '北京大学学生心理健康教育与咨询中心',
    desc: '适合在情绪持续困扰、睡眠和学习明显受影响时预约专业支持。',
    tags: ['stress', 'depression', 'anxiety', 'crisis'],
    levels: ['medium', 'high'],
    urgent: true,
  },
  {
    title: '辅导员 / 班主任 / 导师沟通',
    desc: '适合需要现实帮助、学业协调、请假或安全陪伴时优先联系。',
    tags: ['stress', 'crisis', 'loneliness'],
    levels: ['medium', 'high'],
    urgent: true,
  },
  {
    title: '24 小时心理危机热线',
    desc: '当出现强烈自伤想法或无法保证自身安全时，请立即联系现实中的紧急支持。',
    tags: ['crisis', 'depression'],
    levels: ['high'],
    urgent: true,
  },
  {
    title: '深呼吸练习',
    desc: '用 4 秒吸气、6 秒呼气的节奏重复 3 到 5 分钟，帮助身体从紧张中缓下来。',
    tags: ['anxiety', 'anger', 'stress'],
    levels: ['low', 'medium'],
  },
  {
    title: '正念冥想',
    desc: '把注意力放在呼吸、身体触感或周围声音上，减少反复担心和自责。',
    tags: ['anxiety', 'depression', 'fatigue'],
    levels: ['low', 'medium'],
  },
  {
    title: '校园运动与社团活动',
    desc: '通过低压力的运动、兴趣活动和社团连接，恢复节奏并增加支持感。',
    tags: ['loneliness', 'fatigue', 'stress', 'positive'],
    levels: ['low', 'medium'],
  },
  {
    title: '学业支持与朋辈互助',
    desc: '把任务拆分、找同学一起自习或向助教咨询，降低独自面对 ddl 的压力。',
    tags: ['stress', 'anxiety', 'loneliness'],
    levels: ['low', 'medium'],
  },
  {
    title: '睡眠调整与休息计划',
    desc: '优先固定起床时间，减少熬夜补偿，给高强度学习之间留出恢复窗口。',
    tags: ['fatigue', 'stress'],
    levels: ['low', 'medium'],
  },
];

export function getRecommendedResources(emotion?: Emotion, riskLevel?: RiskLevel, limit = 5) {
  const scored = resources.map((resource) => {
    const emotionScore = emotion && resource.tags.includes(emotion) ? 2 : 0;
    const riskScore = riskLevel && resource.levels.includes(riskLevel) ? 2 : 0;
    return { resource, score: emotionScore + riskScore + Number(Boolean(resource.urgent && riskLevel === 'high')) };
  });
  return scored
    .sort((a, b) => b.score - a.score || Number(Boolean(b.resource.urgent)) - Number(Boolean(a.resource.urgent)))
    .slice(0, limit)
    .map((item) => item.resource);
}