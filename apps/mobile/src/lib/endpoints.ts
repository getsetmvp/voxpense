// Typed endpoint wrappers — one named function per route in design.md § 13.
// Pass through to `api<T>()` in ./api.ts. All require auth except auth routes.

import { api } from './api';
import type {
  User,
  Wallet,
  Group,
  Category,
  Expense,
  Budget,
  Recurring,
  Reminder,
} from '@voxpense/shared-types';

// ── auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const auth = {
  signup: (body: { email: string; password: string; name?: string }) =>
    api<AuthTokens>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    api<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  refresh: (body: { refresh_token: string }) =>
    api<Omit<AuthTokens, 'user'>>('/auth/refresh', { method: 'POST', body: JSON.stringify(body) }),
  logout: (body: { refresh_token: string }) =>
    api<void>('/auth/logout', { method: 'POST', body: JSON.stringify(body) }),
};

// ── users ─────────────────────────────────────────────────────────────────

export const users = {
  me: () => api<User>('/users/me'),
  update: (body: Partial<Pick<User, 'name' | 'baseCurrency' | 'autoSaveVoice' | 'keepVoiceAudio' | 'theme'>> & { fcmToken?: string }) =>
    api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  remove: () => api<void>('/users/me', { method: 'DELETE' }),
};

// ── wallets ───────────────────────────────────────────────────────────────

export const wallets = {
  list: () => api<Wallet[]>('/wallets'),
  create: (body: { name: string; kind: Wallet['kind']; currency?: string; openingBalance?: string }) =>
    api<Wallet>('/wallets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Wallet>) =>
    api<Wallet>(`/wallets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/wallets/${id}`, { method: 'DELETE' }),
};

// ── groups ────────────────────────────────────────────────────────────────

export const groups = {
  list: () => api<Group[]>('/groups'),
  create: (body: { name: string; color: string }) =>
    api<Group>('/groups', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Group>) =>
    api<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/groups/${id}`, { method: 'DELETE' }),
};

// ── categories ────────────────────────────────────────────────────────────

export const categories = {
  list: () => api<Category[]>('/categories'),
  create: (body: { name: string; groupId?: string; color: string; icon: string }) =>
    api<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Category>) =>
    api<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// ── expenses ──────────────────────────────────────────────────────────────

export interface ExpenseListParams {
  from?: string;
  to?: string;
  category_id?: string;
  group_id?: string;
  wallet_id?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface ExpenseListResult {
  data: Expense[];
  next_cursor: string | null;
}

export interface CreateExpenseBody {
  amount: string;
  currency: string;
  merchant?: string;
  note?: string;
  occurredAt: string;
  groupId?: string;
  categoryId?: string;
  walletId: string;
  source: 'voice' | 'photo' | 'manual' | 'recurring';
  audioKey?: string;
  imageKey?: string;
  parseMeta?: Record<string, unknown>;
}

function qs(params: Record<string, unknown> | ExpenseListParams): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const expenses = {
  list: (params: ExpenseListParams = {}) =>
    api<ExpenseListResult>(`/expenses${qs(params)}`),
  get: (id: string) => api<Expense>(`/expenses/${id}`),
  create: (body: CreateExpenseBody) =>
    api<Expense>('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<CreateExpenseBody>) =>
    api<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

// ── budgets ───────────────────────────────────────────────────────────────

export const budgets = {
  list: () => api<Budget[]>('/budgets'),
  create: (body: {
    name: string;
    scope: 'group' | 'category' | 'overall';
    groupId?: string;
    categoryId?: string;
    period: 'weekly' | 'monthly' | 'yearly';
    amount: string;
    currency: string;
    alertAt?: number;
  }) => api<Budget>('/budgets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Budget>) =>
    api<Budget>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/budgets/${id}`, { method: 'DELETE' }),
};

// ── recurring ─────────────────────────────────────────────────────────────

export const recurring = {
  list: () => api<Recurring[]>('/recurring'),
  create: (body: {
    name: string;
    amount: string;
    currency: string;
    categoryId?: string;
    walletId: string;
    rrule: string;
    nextRunAt: string;
    active?: boolean;
  }) => api<Recurring>('/recurring', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Recurring>) =>
    api<Recurring>(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/recurring/${id}`, { method: 'DELETE' }),
};

// ── reminders ─────────────────────────────────────────────────────────────

export const reminders = {
  list: () => api<Reminder[]>('/reminders'),
  create: (body: { title: string; body?: string; scheduledAt: string; rrule?: string }) =>
    api<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Reminder> & { acked?: boolean }) =>
    api<Reminder>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/reminders/${id}`, { method: 'DELETE' }),
};

// ── ai ────────────────────────────────────────────────────────────────────

export interface ParsedExpense {
  amount: string;
  currency: string;
  merchant: string | null;
  note: string | null;
  occurredAt: string | null;
  category_hint: string | null;
}

export interface ParsedReceipt extends ParsedExpense {
  items?: Array<{ name: string; qty: number; price: string }> | null;
}

export interface ParsedReminder {
  title: string;
  body: string | null;
  scheduledAt: string;
  rrule: string | null;
}

export const ai = {
  parseExpense: (body: { transcript: string; locale?: string }) =>
    api<ParsedExpense>('/ai/parse-expense', { method: 'POST', body: JSON.stringify(body) }),
  parseReceipt: (body: { image: { data: string; mime: string } }) =>
    api<ParsedReceipt>('/ai/parse-receipt', { method: 'POST', body: JSON.stringify(body) }),
  parseReminder: (body: { transcript: string; now: string }) =>
    api<ParsedReminder>('/ai/parse-reminder', { method: 'POST', body: JSON.stringify(body) }),
  categorize: (body: { merchant?: string; note?: string; amount: string }) =>
    api<{ categoryId: string | null; confidence: number }>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ask: (body: { question: string; from: string; to: string }) =>
    api<{ answer: string }>('/ai/ask', { method: 'POST', body: JSON.stringify(body) }),
};
