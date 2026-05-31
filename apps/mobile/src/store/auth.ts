// Auth store. Hydrates on boot from secure-store. Drives _layout auth gate.

import { create } from 'zustand';
import type { User } from '@voxpense/shared-types';
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from '../lib/api';
import { auth as authApi, users as usersApi } from '../lib/endpoints';

type Status = 'idle' | 'loading' | 'authed' | 'guest';

interface AuthState {
  status: Status;
  user: User | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,

  hydrate: async () => {
    set({ status: 'loading' });
    const token = await getAccessToken();
    if (!token) {
      set({ status: 'guest', user: null });
      return;
    }
    try {
      const me = await usersApi.me();
      set({ status: 'authed', user: me });
    } catch {
      await clearTokens();
      set({ status: 'guest', user: null });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading' });
    const res = await authApi.login({ email, password });
    await setTokens(res.access_token, res.refresh_token);
    set({ status: 'authed', user: res.user });
  },

  signup: async (email, password, name) => {
    set({ status: 'loading' });
    const res = await authApi.signup({ email, password, name });
    await setTokens(res.access_token, res.refresh_token);
    set({ status: 'authed', user: res.user });
  },

  logout: async () => {
    await clearTokens();
    set({ status: 'guest', user: null });
  },

  refreshUser: async () => {
    if (get().status !== 'authed') return;
    const me = await usersApi.me();
    set({ user: me });
  },

  setUser: (u) => set({ user: u }),
}));
