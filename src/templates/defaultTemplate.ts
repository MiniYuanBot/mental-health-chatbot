import type { Emotion } from '../utils/emotion';
import { emotionLabels } from '../utils/emotion';
import { ResponseTemplate } from './responseTemplate';

// 模板方法模式：通用情绪回复步骤实现
export class DefaultTemplate extends ResponseTemplate {
  protected generateEmpathy(emotion: Emotion): string {
    return `我听见了你此刻的${emotionLabels[emotion]}状态，谢谢你愿意把它说出来。`;
  }

  protected generateAdvice(): string {
    return '可以先停一分钟，感受脚踩地面的触感，再把最困扰你的事情拆成一个现在能做的小动作。';
  }

  protected generateClosing(): string {
    return '提醒：我不能进行医学诊断，也不能替代专业心理咨询；如果状态持续影响生活，请及时寻求现实中的专业支持。';
  }
}