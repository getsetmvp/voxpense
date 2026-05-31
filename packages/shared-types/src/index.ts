// Shared types mirroring server DTOs. Single source of truth for mobile + (future) web.
// Per design.md § 13 API contract. Agent A (Phase 5) fills these against server-side DTOs.

// ── domain entities ───────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string | null;
  baseCurrency: string;
  autoSaveVoice: boolean;
  keepVoiceAudio: boolean;
  theme: 'auto' | 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export type WalletKind = 'cash' | 'card' | 'upi' | 'bank' | 'other';

export interface Wallet {
  id: string;
  name: string;
  kind: WalletKind;
  currency: string;
  openingBalance: string; // Decimal as string for safe JSON transport
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  groupId: string | null;
  color: string;
  icon: string;
  createdAt: string;
}

export type ExpenseSource = 'voice' | 'photo' | 'manual' | 'recurring';

export interface ParseMeta {
  confidence?: number;
  transcript?: string;
  ocrText?: string;
  model?: string;
  [k: string]: unknown;
}

export interface Expense {
  id: string;
  amount: string; // Decimal as string
  currency: string;
  merchant: string | null;
  note: string | null;
  occurredAt: string;
  groupId: string | null;
  categoryId: string | null;
  walletId: string;
  source: ExpenseSource;
  audioKey: string | null;
  imageKey: string | null;
  parseMeta: ParseMeta | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BudgetScope = 'group' | 'category' | 'overall';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  name: string;
  scope: BudgetScope;
  groupId: string | null;
  categoryId: string | null;
  period: BudgetPeriod;
  amount: string;
  currency: string;
  alertAt: number; // 0-100 percentage
  createdAt: string;
  updatedAt: string;
}

export interface Recurring {
  id: string;
  name: string;
  amount: string;
  currency: string;
  categoryId: string | null;
  walletId: string;
  rrule: string;
  nextRunAt: string;
  lastRunAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  body: string | null;
  scheduledAt: string;
  rrule: string | null;
  acked: boolean;
  createdAt: string;
}

// ── auth DTOs ─────────────────────────────────────────────────────────────
export interface SignupDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ── AI DTOs ───────────────────────────────────────────────────────────────
export interface ParseExpenseDto {
  transcript: string;
  audio_base64?: string;
  hint_currency?: string;
}

export interface ParseExpenseResult {
  amount: string;
  currency: string | null;
  merchant: string | null;
  note: string | null;
  category_hint: string | null;
  wallet_hint: string | null;
  confidence: number;
}

export interface ParseReceiptDto {
  ocr_text: string;
  image_base64?: string;
  hint_currency?: string;
}

export interface ParseReceiptResult {
  amount: string;
  currency: string | null;
  merchant: string | null;
  items: Array<{ name: string; price: number }> | null;
  category_hint: string | null;
  occurred_at: string | null;
  confidence: number;
}

export interface CategorizeDto {
  amount: string;
  note?: string;
  merchant?: string;
}

export interface CategorizeResult {
  category_id: string;
  confidence: number;
  reasoning: string | null;
}

export interface AskDto {
  question: string;
  session_id?: string;
}

export interface AskResult {
  answer_text: string;
  chart_hint: {
    type: 'line' | 'bar' | 'donut' | null;
    data: Array<{ label: string; value: number }>;
    x_label?: string;
    y_label?: string;
  } | null;
  deep_link: {
    screen: 'expenses';
    filter: {
      from?: string;
      to?: string;
      category_id?: string;
      group_id?: string;
      wallet_id?: string;
    };
  } | null;
  follow_ups: string[];
  session_id: string;
}

// ── pagination ────────────────────────────────────────────────────────────
export interface Page<T> {
  data: T[];
  next_cursor: string | null;
}

// ── error envelope (per backend.md standard) ──────────────────────────────
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  path: string;
  timestamp: string;
  tenant?: string;
  version?: string;
}
