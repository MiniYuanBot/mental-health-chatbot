import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmotionBadge from '../components/EmotionBadge';
import RiskAlert from '../components/RiskAlert';
import { fetchEmotionHistory } from '../utils/api';
import { getEmotionRecords, getProfile } from '../utils/storage';
import type { EmotionRecord } from '../utils/storage';

const quickLinks = [
  { to: '/chat', title: '开始聊天', desc: '记录此刻情绪，获得温和支持' },
  { to: '/report', title: '查看报告', desc: '观察最近压力与情绪趋势' },
  { to: '/resources', title: '资源推荐', desc: '查看校园与自助支持资源' },
  { to: '/profile', title: '匿名设置', desc: '设置聊天中展示的虚拟昵称' },
];

export default function Dashboard() {
  const profile = getProfile();
  const [records, setRecords] = useState<EmotionRecord[]>(() => getEmotionRecords());
  const latest = records.at(-1);

  useEffect(() => {
    fetchEmotionHistory()
      .then((result) => setRecords(result.records))
      .catch(() => setRecords(getEmotionRecords()));
  }, []);

  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">PKU Mental Health Demo</p>
          <h1>{profile.nickname}，今天想从哪里开始？</h1>
          <p>
            这是一个面向课程展示的 AI 心理健康陪伴与情绪支持系统，使用本地 mock
            回复、后端 SQLite 情绪记录和校园资源推荐展示完整功能流程。
          </p>
        </div>
        <div className="status-card">
          <span>今日状态</span>
          {latest ? (
            <>
              <EmotionBadge
                emotion={latest.emotion}
                score={latest.score}
                riskLevel={latest.riskLevel}
              />
              <small>{new Date(latest.time).toLocaleString('zh-CN', { hour12: false })}</small>
            </>
          ) : (
            <p>还没有情绪记录，可以先开始一次聊天。</p>
          )}
        </div>
      </section>

      {latest?.riskLevel === 'high' && <RiskAlert />}

      <section className="grid-4">
        {quickLinks.map((item) => (
          <Link className="feature-card" key={item.to} to={item.to}>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
          </Link>
        ))}
      </section>

      <section className="info-panel">
        <h2>演示边界</h2>
        <p>
          本系统不进行医学诊断，不替代专业心理咨询。它只用于展示情绪识别、支持性回复、趋势记录和校园资源推荐等课程 Demo
          功能。
        </p>
      </section>
    </div>
  );
}
