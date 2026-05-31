// Fetch wrapper for server.getsetmvp.com/voxpense/v1/* — JWT in Authorization header.
// Tokens stored in expo-secure-store (NOT AsyncStorage per ADR / standard).

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE = (Constants.expoConfig?.extra as any)?.apiUrl ?? 'https://server.getsetmvp.com';
const TENANT = (Constants.expoConfig?.extra as any)?.tenant ?? 'voxpense';
const VERSION = 'v1';

const TOKEN_KEY = 'voxpense_access_token';
const REFRESH_KEY = 'voxpense_refresh_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    public path: string,
  ) {
    const msg = (body as { message?: string })?.message ?? `HTTP ${status} on ${path}`;
    super(msg);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE}/${TENANT}/${VERSION}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    await setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

async function rawFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE}/${TENANT}/${VERSION}${path}`, { ...init, headers });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await getAccessToken();
  let res = await rawFetch(path, init, token);

  // Auto-refresh on 401, retry once
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawFetch(path, init, newToken);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body, path);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiBase = `${BASE}/${TENANT}/${VERSION}`;
