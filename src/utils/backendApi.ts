export const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '后端请求失败。');
  }
  return data as T;
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

export function fetchProfile(token: string) {
  return request<{ user: BackendUser }>('/api/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateProfile(token: string, nickname: string) {
  return request<{ user: BackendUser }>('/api/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nickname }),
  });
}
