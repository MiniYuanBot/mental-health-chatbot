import EmotionBadge from './EmotionBadge';
import type { ChatMessage } from '../utils/storage';

type Props = {
  message: ChatMessage;
  nickname: string;
};

export default function ChatBubble({ message, nickname }: Props) {
  const isUser = message.role === 'user';

  return (
    <article className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-ai'}`}>
      <div className="chat-avatar">{isUser ? nickname.slice(0, 1) || '匿' : 'AI'}</div>
      <div className={`chat-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        <div className="chat-bubble-meta">
          <span>{isUser ? nickname : '北大心晴助手'}</span>
          <time>{new Date(message.time).toLocaleString('zh-CN', { hour12: false })}</time>
        </div>
        <p>{message.content}</p>
        {isUser && message.emotion && (
          <div className="bubble-footer">
            <EmotionBadge
              emotion={message.emotion}
              riskLevel={message.riskLevel}
              score={message.score}
            />
          </div>
        )}
      </div>
    </article>
  );
}
