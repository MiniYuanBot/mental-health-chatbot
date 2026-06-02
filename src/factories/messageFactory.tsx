import { createElement, type ReactElement } from 'react';
import type { ChatMessage, Profile } from '../utils/storage';
import { AIMessage, UserMessage } from './messageComponents';

// 工厂方法模式：按消息角色创建对应 React 消息组件
export class MessageFactory {
  static create(message: ChatMessage, profile: Profile): ReactElement {
    const component = message.role === 'user' ? UserMessage : AIMessage;
    return createElement(component, { key: message.id, message, profile });
  }
}