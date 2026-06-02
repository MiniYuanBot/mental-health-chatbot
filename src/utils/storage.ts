import type { Emotion, RiskLevel } from './emotion';

const AUTH_KEY = 'pku_mh_auth';
const PROFILE_KEY = 'pku_mh_profile';
const CHAT_KEY = 'pku_mh_chat_messages';
const RECORD_KEY = 'pku_mh_emotion_records';

export type AuthInfo = {
  userId: string;
  email: string;
  studentId: string;
  token: string;
  loginTime: string;
};

export type Profile = {
  nickname: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  emotion?: Emotion;
  score?: number;
  riskLevel?: RiskLevel;
  analysisSource?: 'api' | 'local' | 'server';
  analysisModel?: string;
};

export type EmotionRecord = {
  id: string;
  content: string;
  emotion: Emotion;
  score: number;
  riskLevel: RiskLevel;
  time: string;
  analysisSource?: 'api' | 'local' | 'server';
  analysisModel?: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAuth(): AuthInfo | null {
  return readJson<AuthInfo | null>(AUTH_KEY, null);
}

export function setAuth(auth: AuthInfo) {
  writeJson(AUTH_KEY, auth);
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getProfile(): Profile {
  return readJson<Profile>(PROFILE_KEY, { nickname: '匿名同学' });
}

export function setProfile(profile: Profile) {
  writeJson(PROFILE_KEY, profile);
}

export function getChatMessages(): ChatMessage[] {
  return readJson<ChatMessage[]>(CHAT_KEY, []);
}

export function setChatMessages(messages: ChatMessage[]) {
  writeJson(CHAT_KEY, messages);
}

export function addChatMessages(messages: ChatMessage[]) {
  setChatMessages([...getChatMessages(), ...messages]);
}

export function clearChatMessages() {
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(RECORD_KEY);
}

export function getEmotionRecords(): EmotionRecord[] {
  return readJson<EmotionRecord[]>(RECORD_KEY, []);
}

export function setEmotionRecords(records: EmotionRecord[]) {
  writeJson(RECORD_KEY, records);
}

export function addEmotionRecord(record: EmotionRecord) {
  writeJson(RECORD_KEY, [...getEmotionRecords(), record]);
}
