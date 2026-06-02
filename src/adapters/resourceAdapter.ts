import type { ApiEmotionRecord } from '../utils/api';
import type { Resource } from '../data/resources';

// 适配器模式：把情绪历史记录转换成资源卡片可消费的数据
export class ResourceAdapter {
  static recordToResource(record: ApiEmotionRecord): Resource {
    return {
      title: `情绪记录 ${record.time.slice(0, 10)}`,
      desc: `最近记录为 ${record.emotion}，强度 ${record.score}/10，风险等级 ${record.riskLevel}。`,
      tags: [record.emotion],
      levels: [record.riskLevel],
      urgent: record.riskLevel === 'high',
    };
  }

  static toResourceList(records: ApiEmotionRecord[]): Resource[] {
    return records.slice(-3).map((record) => this.recordToResource(record));
  }
}