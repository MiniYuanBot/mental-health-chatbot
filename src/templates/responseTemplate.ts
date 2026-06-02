import type { Emotion } from '../utils/emotion';

// 模板方法模式：固定心理支持回复的共情、建议、收束流程
export abstract class ResponseTemplate {
  generate(userText: string, emotion: Emotion): string {
    this.validate(userText);
    return [
      this.generateEmpathy(emotion),
      this.generateAdvice(userText, emotion),
      this.generateClosing(emotion),
    ].join('\n\n');
  }

  protected abstract generateEmpathy(emotion: Emotion): string;
  protected abstract generateAdvice(userText: string, emotion: Emotion): string;
  protected abstract generateClosing(emotion: Emotion): string;

  private validate(text: string): void {
    if (!text.trim()) {
      throw new Error('输入为空。');
    }
  }
}