import { useEffect, useState } from 'react';
import EmotionBadge from '../components/EmotionBadge';
import ResourceCard from '../components/ResourceCard';
import RiskAlert from '../components/RiskAlert';
import { getRecommendedResources, resources } from '../data/resources';
import { fetchEmotionHistory } from '../utils/api';
import { emotionLabels, type Emotion } from '../utils/emotion';
import { getEmotionRecords, setEmotionRecords, type EmotionRecord } from '../utils/storage';

function recommendationTitle(emotion: Emotion | undefined) {
  if (!emotion) return '通用资源';
  if (emotion === 'crisis') return '高优先级现实求助资源';
  return `根据最近情绪“${emotionLabels[emotion]}”推荐`;
}

export default function Resources() {
  const [records, setRecords] = useState<EmotionRecord[]>(() => getEmotionRecords());
  const latest = records.at(-1);

  useEffect(() => {
    fetchEmotionHistory()
      .then((result) => {
        setRecords(result.records);
        setEmotionRecords(result.records);
      })
      .catch(() => setRecords(getEmotionRecords()));
  }, []);

  const recommended = getRecommendedResources(latest?.emotion, latest?.riskLevel, 5);

  return (
    <div className="content-stack">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Resources</p>
          <h1>校园资源推荐</h1>
          <p>资源根据后端保存的最近情绪与风险等级动态推荐，仅作为课程 Demo 示例。</p>
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
          {recommended.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
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
