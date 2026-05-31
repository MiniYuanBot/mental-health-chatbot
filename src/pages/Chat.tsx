import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import ChatBubble from '../components/ChatBubble';
import RiskAlert from '../components/RiskAlert';
import { AI_API_KEY, AI_BASE_URL, AI_MODEL, analyzeEmotionWithApi, createApiReply } from '../utils/aiApi';
import {
  addChatMessages,
  addEmotionRecord,
  clearChatMessages,
  getChatMessages,
  getProfile,
  setChatMessages,
  type ChatMessage,
} from '../utils/storage';

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content:
    '你好，我是北大心晴助手。你可以直接说说此刻的感受、学习压力或最近发生的事。我会给出支持性回应，但不会进行医学诊断。',
  time: new Date().toISOString(),
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Chat() {
  const profile = getProfile();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = getChatMessages();
    return stored.length > 0 ? stored : [welcomeMessage];
  });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const latestHighRisk = messages
    .filter((message) => message.role === 'user')
    .some((message) => message.riskLevel === 'high');

  useEffect(() => {
    if (getChatMessages().length === 0) {
      setChatMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || isSending) return;

    setInput('');
    setIsSending(true);

    const analysis = await analyzeEmotionWithApi(content);
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content,
      time: now,
      emotion: analysis.emotion,
      score: analysis.score,
      riskLevel: analysis.riskLevel,
      analysisSource: analysis.analysisSource,
      analysisModel: analysis.analysisModel,
    };

    const messagesBeforeSend = messages;
    setMessages([...messagesBeforeSend, userMessage]);
    addChatMessages([userMessage]);
    addEmotionRecord({
      id: userMessage.id,
      content,
      emotion: analysis.emotion,
      score: analysis.score,
      riskLevel: analysis.riskLevel,
      analysisSource: analysis.analysisSource,
      analysisModel: analysis.analysisModel,
      time: now,
    });

    const apiHistory = messagesBeforeSend
      .filter((message) => message.id !== 'welcome')
      .map((message) => ({
        role: message.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: message.content,
      }));
    const reply = await createApiReply(content, analysis, apiHistory);
    const aiMessage: ChatMessage = {
      id: createId(),
      role: 'ai',
      content: reply,
      time: new Date().toISOString(),
    };
    setMessages((current) => [...current, aiMessage]);
    addChatMessages([aiMessage]);
    setIsSending(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function resetChat() {
    clearChatMessages();
    setMessages([welcomeMessage]);
    setChatMessages([welcomeMessage]);
  }

  return (
    <div className="chat-page">
      <section className="chat-header">
        <div>
          <p className="eyebrow">AI Companion</p>
          <h1>AI 陪伴聊天</h1>
          <p>聊天中仅展示虚拟昵称：{profile.nickname}</p>
          <p className="api-status">
            情绪识别/API 回复：{AI_API_KEY ? '已配置真实接口' : '未配置，使用本地 mock'} · Model：{AI_MODEL} ·
            Base URL：{AI_BASE_URL}
          </p>
        </div>
        <button className="ghost-button" onClick={resetChat}>
          清空记录
        </button>
      </section>

      {latestHighRisk && <RiskAlert />}

      <section className="chat-window" aria-label="聊天记录">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} nickname={profile.nickname} />
        ))}
        {isSending && (
          <div className="typing-indicator" aria-live="polite">
            正在识别情绪并生成回复...
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSending ? '正在等待 API 识别与回复...' : '输入你现在的感受，按 Enter 发送，Shift + Enter 换行'}
          disabled={isSending}
          rows={2}
        />
        <button className="primary-button" type="submit" disabled={isSending}>
          {isSending ? '等待' : '发送'}
        </button>
      </form>
    </div>
  );
}
