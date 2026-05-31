import EmotionBadge from '../components/EmotionBadge';
import RiskAlert from '../components/RiskAlert';
import { emotionLabels, type Emotion } from '../utils/emotion';
import { getEmotionRecords } from '../utils/storage';

type Resource = {
  title: string;
  desc: string;
  tags: Emotion[];
  urgent?: boolean;
};

const resources: Resource[] = [
  {
    title: '北京大学学生心理健康教育与咨询中心',
    desc: '适合在情绪持续困扰、睡眠和学习明显受影响时预约专业支持。',
    tags: ['stress', 'depression', 'anxiety', 'crisis'],
    urgent: true,
  },
  {
    title: '辅导员 / 班主任 / 导师沟通',
    desc: '适合需要现实帮助、学业协调、请假或安全陪伴时优先联系。',
    tags: ['stress', 'crisis', 'loneliness'],
    urgent: true,
  },
  {
    title: '深呼吸练习',
    desc: '用 4 秒吸气、6 秒呼气的节奏重复 3 到 5 分钟，帮助身体从紧张中缓下来。',
    tags: ['anxiety', 'anger', 'stress'],
  },
  {
    title: '正念冥想',
    desc: '把注意力放在呼吸、身体触感或周围声音上，减少反复担心和自责。',
    tags: ['anxiety', 'depression', 'fatigue'],
  },
  {
    title: '校园运动与社团活动',
    desc: '通过低压力的运动、兴趣活动和社团连接，恢复节奏并增加支持感。',
    tags: ['loneliness', 'fatigue', 'stress', 'positive'],
  },
  {
    title: '学业支持与朋辈互助',
    desc: '把任务拆分、找同学一起自习或向助教咨询，降低独自面对 ddl 的压力。',
    tags: ['stress', 'anxiety', 'loneliness'],
  },
  {
    title: '睡眠调整与休息计划',
    desc: '优先固定起床时间，减少熬夜补偿，给高强度学习之间留出恢复窗口。',
    tags: ['fatigue', 'stress'],
  },
];

function recommendationTitle(emotion: Emotion | undefined) {
  if (!emotion) return '通用资源';
  if (emotion === 'crisis') return '高优先级现实求助资源';
  return `根据最近情绪“${emotionLabels[emotion]}”推荐`;
}

export default function Resources() {
  const records = getEmotionRecords();
  const latest = records.at(-1);
  const recommended = latest
    ? resources
        .filter((resource) => resource.tags.includes(latest.emotion))
        .sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)))
    : resources.slice(0, 4);
  const fallback = recommended.length > 0 ? recommended : resources.slice(0, 4);

  return (
    <div className="content-stack">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Resources</p>
          <h1>校园资源推荐</h1>
          <p>以下为课程 Demo 写死的示例资源，不代表真实预约入口。</p>
        </div>
        {latest && (
          <EmotionBadge
            emotion={latest.emotion}
            score={latest.score}
            riskLevel={latest.riskLevel}
          />
        )}
      </section>

      {latest?.riskLevel === 'high' && <RiskAlert />}

      <section className="panel">
        <h2>{recommendationTitle(latest?.emotion)}</h2>
        <div className="resource-grid">
          {fallback.map((resource) => (
            <article className={resource.urgent ? 'resource-card urgent' : 'resource-card'} key={resource.title}>
              <h3>{resource.title}</h3>
              <p>{resource.desc}</p>
              <div className="tag-row">
                {resource.tags.slice(0, 4).map((tag) => (
                  <span key={tag}>{emotionLabels[tag]}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel secondary-panel">
        <h2>全部示例资源</h2>
        <div className="resource-list">
          {resources.map((resource) => (
            <div key={resource.title}>
              <strong>{resource.title}</strong>
              <p>{resource.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
