import { ResponseTemplate } from './responseTemplate';

// 模板方法模式：低落场景的专业回复步骤实现
export class DepressionTemplate extends ResponseTemplate {
  protected generateEmpathy(): string {
    return '谢谢你把这些低落说出来，能撑到现在已经很不容易。';
  }

  protected generateAdvice(): string {
    return '先把今天的目标降到很小：喝水、吃点东西、给一位可信任的人发一句“我今天有点难受”。';
  }

  protected generateClosing(): string {
    return '你不需要独自扛着。如果出现自伤想法，请立刻联系身边的人、辅导员、心理咨询中心或紧急求助电话。';
  }
}