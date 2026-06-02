import type { Emotion, RiskLevel } from './emotion';
import { clearAuth, getAuth } from './storage';

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 10_000;

export type BackendUser = {
  id: string;
  email: string;
  studentId: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: BackendUser;
};

export type ApiChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  emotion?: Emotion | null;
  score?: number | null;
  riskLevel?: RiskLevel | null;
};

export type ApiEmotionRecord = {
  id: string;
  content: string;
  emotion: Emotion;
  score: number;
  riskLevel: RiskLevel;
  time: string;
  analysisSource?: 'api' | 'local' | 'server';
  analysisModel?: string;
};

export type ChatResponse = {
  reply: string;
  analysis: {
    emotion: Emotion;
    score: number;
    riskLevel: RiskLevel;
  };
  messages: ApiChatMessage[];
  record: ApiEmotionRecord;
};

export type EmotionHistoryResponse = {
  records: ApiEmotionRecord[];
  messages: ApiChatMessage[];
};

export type ApiMessageHistoryItem = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ApiErrorBody = {
  error?: string;
  code?: number;
};

function redirectToLoginOnUnauthorized(status: number) {
  if (status !== 401) return;
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = getAuth()?.token;

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    const data = (await response.json().catch(() => ({}))) as ApiErrorBody;
    if (!response.ok) {
      redirectToLoginOnUnauthorized(response.status);
      throw new Error(data.error || '后端请求失败。');
    }
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('服务维护中，请稍后重试。');
    }
    if (error instanceof TypeError) {
      throw new Error('服务维护中，请稍后重试。');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function signup(payload: {
  email: string;
  studentId: string;
  password: string;
  nickname: string;
}) {
  return request<AuthResponse>('/api/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return request<AuthResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchProfile() {
  return request<{ user: BackendUser }>('/api/profile');
}

export function updateProfile(nickname: string) {
  return request<{ user: BackendUser }>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ nickname }),
  });
}

export function sendChatMessage(payload: {
  message: string;
  reply?: string;
  emotion?: Emotion;
  score?: number;
  riskLevel?: RiskLevel;
  analysisSource?: 'api' | 'local';
  analysisModel?: string;
}) {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchEmotionHistory() {
  return request<EmotionHistoryResponse>('/api/emotion-history');
}

export function healthCheck() {
  return request<{ ok: boolean; database: string }>('/api/health');
}