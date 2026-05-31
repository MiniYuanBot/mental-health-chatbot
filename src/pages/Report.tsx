import { useEffect, useState } from 'react';
import EmotionBadge from '../components/EmotionBadge';
import RiskAlert from '../components/RiskAlert';
import { AI_API_KEY, analyzeEmotionWithApi } from '../utils/aiApi';
import { emotionLabels, riskLabels, type Emotion } from '../utils/emotion';
import { getEmotionRecords, setEmotionRecords, type EmotionRecord } from '../utils/storage';

const trackedEmotions: Emotion[] = [
  'stress',
  'anxiety',
  'depression',
  'anger',
  'fatigue',
  'loneliness',
  'positive',
  'neutral',
  'crisis',
];

export default function Report() {
  const [records, setRecords] = useState<EmotionRecord[]>(() => getEmotionRecords());
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    async function reanalyzeHistoryWithApi() {
      if (!AI_API_KEY || records.length === 0) return;

      const shouldReanalyze = records.some((record) => record.analysisSource !== 'api');
      if (!shouldReanalyze) return;

      setIsReanalyzing(true);
      const updatedRecords = await Promise.all(
        records.map(async (record) => {
          if (record.analysisSource === 'api') return record;
          const analysis = await analyzeEmotionWithApi(record.content);
          return {
            ...record,
            emotion: analysis.emotion,
            score: analysis.score,
            riskLevel: analysis.riskLevel,
            analysisSource: analysis.analysisSource,
            analysisModel: analysis.analysisModel,
          };
        }),
      );
      setEmotionRecords(updatedRecords);
      setRecords(updatedRecords);
      setIsReanalyzing(false);
    }

    reanalyzeHistoryWithApi();
  }, []);

  const latest = records.at(-1);
  const averageScore =
    records.length === 0
      ? 0
      : records.reduce((sum, item) => sum + item.score, 0) / records.length;
  const highRiskCount = records.filter((item) => item.riskLevel === 'high').length;
  const recentSeven = records.slice(-7);
  const maxScore = Math.max(10, ...recentSeven.map((item) => item.score));
  const chartPoints = recentSeven.map((item, index) => {
    const x = recentSeven.length === 1 ? 150 : 20 + index * (260 / (recentSeven.length - 1));
    const y = 150 - (item.score / maxScore) * 130;
    return { ...item, x, y, label: index + 1 };
  });
  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const stressOrFatigueCount = records.filter(
    (item) => item.emotion === 'stress' || item.emotion === 'fatigue',
  ).length;
  const needFatigueWarning = stressOrFatigueCount >= 3;
  const distribution = trackedEmotions
    .map((emotion) => ({
      emotion,
      count: records.filter((item) => item.emotion === emotion).length,
    }))
    .filter((item) => item.count > 0);
  const maxDistribution = Math.max(1, ...distribution.map((item) => item.count));

  return (
    <div className="content-stack">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Report</p>
          <h1>情绪趋势报告</h1>
          <p>
            报告数据来自当前浏览器 localStorage 中的历史聊天记录。
            {isReanalyzing ? ' 正在调用 API 重新识别历史记录...' : ''}
          </p>
        </div>
      </section>

      {latest?.riskLevel === 'high' && <RiskAlert />}

      {records.length === 0 ? (
        <section className="empty-state">
          <h2>暂无情绪记录</h2>
          <p>开始一次 AI 陪伴聊天后，这里会展示趋势报告。</p>
        </section>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric-card">
              <span>最近情绪状态</span>
              {latest && (
                <EmotionBadge
                  emotion={latest.emotion}
                  score={latest.score}
                  riskLevel={latest.riskLevel}
                />
              )}
            </div>
            <div className="metric-card">
              <span>平均压力分</span>
              <strong>{averageScore.toFixed(1)}</strong>
              <small>满分 10 分，基于用户消息情绪强度</small>
            </div>
            <div className="metric-card">
              <span>高风险次数</span>
              <strong>{highRiskCount}</strong>
              <small>包含危机关键词时记为高风险</small>
            </div>
          </section>

          {needFatigueWarning && (
            <section className="warning-panel">
              <h2>学习疲劳预警</h2>
              <p>
                最近记录中压力或疲劳出现较多。建议安排固定休息、降低连续学习时长，并在需要时向辅导员、导师或心理咨询中心寻求支持。
              </p>
            </section>
          )}

          <section className="panel">
            <div className="section-title-line">
              <h2>最近 7 次对话情绪强度变化</h2>
              <span>{AI_API_KEY ? 'API 识别结果' : '本地规则识别结果'}</span>
            </div>
            <div className="line-chart" aria-label="最近七次压力变化折线图">
              <svg viewBox="0 0 300 178" role="img">
                <title>最近 7 次对话情绪强度变化</title>
                <text className="axis-label" x="6" y="24">
                  10
                </text>
                <text className="axis-label" x="10" y="87">
                  5
                </text>
                <text className="axis-label" x="10" y="152">
                  0
                </text>
                <line x1="20" y1="150" x2="280" y2="150" />
                <line x1="20" y1="20" x2="20" y2="150" />
                {polylinePoints && <polyline points={polylinePoints} />}
                {chartPoints.map((point) => (
                  <g key={point.id}>
                    <circle cx={point.x} cy={point.y} r="5">
                      <title>{`${emotionLabels[point.emotion]} ${point.score}/10`}</title>
                    </circle>
                    <text x={point.x} y="171">
                      {point.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </section>

          <section className="panel">
            <div className="section-title-line">
              <h2>最近对话情绪明细</h2>
              <span>显示真实保存并写回 localStorage 的统计结果</span>
            </div>
            <div className="record-table-wrap">
              <table className="record-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>时间</th>
                    <th>消息摘要</th>
                    <th>识别情绪</th>
                    <th>强度</th>
                    <th>风险</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .slice(-10)
                    .reverse()
                    .map((record, index) => (
                      <tr key={record.id}>
                        <td>{records.length - index}</td>
                        <td>{new Date(record.time).toLocaleString('zh-CN', { hour12: false })}</td>
                        <td>{record.content}</td>
                        <td>{emotionLabels[record.emotion]}</td>
                        <td>{record.score}/10</td>
                        <td>{riskLabels[record.riskLevel]}</td>
                        <td>
                          <span className={`source-badge source-${record.analysisSource ?? 'local'}`}>
                            {record.analysisSource === 'api' ? 'API' : '本地'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>情绪分布统计</h2>
            <div className="bar-list">
              {distribution.map((item) => (
                <div className="bar-row" key={item.emotion}>
                  <span>{emotionLabels[item.emotion]}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill emotion-${item.emotion}`}
                      style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                    />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
