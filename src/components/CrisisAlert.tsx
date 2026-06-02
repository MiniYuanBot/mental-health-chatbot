import { useState } from 'react';

type Props = {
  open: boolean;
};

export default function CrisisAlert({ open }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (!open || dismissed) return null;

  return (
    <div className="crisis-overlay" role="alertdialog" aria-modal="true" aria-labelledby="crisis-title">
      <section className="crisis-dialog">
        <p className="eyebrow">High Risk Notice</p>
        <h2 id="crisis-title">请优先联系现实中的支持</h2>
        <p>
          如果你正在经历强烈的自伤或自杀想法，请立即联系身边可信任的人、辅导员、学校心理咨询中心，或拨打当地紧急求助电话。请尽量不要独处，前往有人陪伴和能获得帮助的地方。
        </p>
        <dl className="crisis-list">
          <div>
            <dt>学校心理咨询中心</dt>
            <dd>北京大学学生心理健康教育与咨询中心：请以学校官网公布电话为准</dd>
          </div>
          <div>
            <dt>24 小时危机热线</dt>
            <dd>北京心理危机研究与干预中心热线：010-82951332</dd>
          </div>
          <div>
            <dt>免责声明</dt>
            <dd>本 Demo 不提供医学诊断，不替代专业心理咨询、医疗或紧急救助。</dd>
          </div>
        </dl>
        <button className="primary-button" type="button" onClick={() => setDismissed(true)}>
          我已了解
        </button>
      </section>
    </div>
  );
}