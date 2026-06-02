import type { Emotion } from '../utils/emotion';
import { ResponseTemplate } from './responseTemplate';

// 模板方法模式：焦虑场景的专业回复步骤实现
export class AnxietyTemplate extends ResponseTemplate {
  protected generateEmpathy(): string {
    return '我能感受到你的焦虑和紧绷，这种状态确实会让人很消耗。';
  }

  protected generateAdvice(): string {
    return '可以先试一次 4-6 呼吸：吸气 4 秒、呼气 6 秒，重复 5 轮；然后写下现在最能推进的一件小事。';
  }

  protected generateClosing(_emotion: Emotion): string {
    return '如果焦虑持续影响睡眠、饮食或学习，建议预约学校心理咨询中心或联系可信任的人陪你一起处理。';
  }
}