// Auth helpers — store/load JWT in expo-secure-store, sign-in/up/out flows.

import { api, setTokens, clearTokens, getAccessToken } from './api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  baseCurrency: string;
  autoSaveVoice: boolean;
  keepVoiceAudio: boolean;
  theme: 'auto' | 'light' | 'dark';
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export async function signUp(email: string, password: string, name?: string): Promise<User> {
  const data = await api<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  await setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const data = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function signOut(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST' });
  } catch {
    // ignore — clear locally regardless
  }
  await clearTokens();
}

export async function isAuthed(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
