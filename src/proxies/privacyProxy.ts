// 代理模式：在真实 AI 调用前统一执行隐私脱敏
export class PrivacyProxy {
  private static readonly patterns: Array<{ regex: RegExp; mask: string }> = [
    { regex: /\b\d{10}\b/g, mask: '[学号]' },
    { regex: /[a-zA-Z0-9._%+-]+@(?:stu\.)?pku\.edu\.cn/g, mask: '[北大邮箱]' },
    { regex: /\b(?:13\d|15\d|17\d|18\d|19\d)\d{8}\b/g, mask: '[手机号]' },
  ];

  static sanitize(text: string): string {
    return this.patterns.reduce((current, pattern) => current.replace(pattern.regex, pattern.mask), text);
  }

  static analyze<T>(text: string, realAnalyze: (sanitizedText: string) => Promise<T>): Promise<T> {
    return realAnalyze(this.sanitize(text));
  }
}