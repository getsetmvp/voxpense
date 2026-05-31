// Pure aggregation helpers for insights screen. Testable, no React/RN.
// Operates on Expense + Budget arrays. All amount math uses Number — server
// returns Decimal-as-string; we coerce at the edge.

import type { Budget, Category, Expense } from '@voxpense/shared-types';

// ── date utilities ────────────────────────────────────────────────────────

/** Returns ISO `YYYY-MM-DD` slice. */
export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Start of day for given Date as new Date (local). */
export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Start of month for given Date (local). */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** Sunday-start week. */
export function startOfWeek(d: Date): Date {
  const out = startOfDay(d);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

/** Add `days` to a Date and return a new instance. */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

// ── numeric coercion ──────────────────────────────────────────────────────

export function toNumber(amount: string | number | null | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return Number.isFinite(n) ? n : 0;
}

// ── sums ──────────────────────────────────────────────────────────────────

export function sumExpenses(expenses: Expense[]): number {
  let total = 0;
  for (const e of expenses) total += toNumber(e.amount);
  return total;
}

/** Sum expenses where `occurredAt` falls within `[from, to)` (both ISO). */
export function sumBetween(expenses: Expense[], from: Date, to: Date): number {
  let total = 0;
  const fromMs = from.getTime();
  const toMs = to.getTime();
  for (const e of expenses) {
    const t = new Date(e.occurredAt).getTime();
    if (t >= fromMs && t < toMs) total += toNumber(e.amount);
  }
  return total;
}

// ── grouping ──────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
  share: number; // 0..1
}

export function groupByCategory(
  expenses: Expense[],
  categories: Category[],
): CategoryBreakdown[] {
  const byId = new Map<string, Category>();
  for (const c of categories) byId.set(c.id, c);

  const totals = new Map<string | null, number>();
  for (const e of expenses) {
    const key = e.categoryId;
    totals.set(key, (totals.get(key) ?? 0) + toNumber(e.amount));
  }

  const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  const rows: CategoryBreakdown[] = [];
  for (const [categoryId, total] of totals.entries()) {
    const cat = categoryId ? byId.get(categoryId) : undefined;
    rows.push({
      categoryId,
      name: cat?.name ?? 'Uncategorized',
      color: cat?.color ?? '#94A3B8',
      total,
      share: sum > 0 ? total / sum : 0,
    });
  }
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

export interface MerchantBreakdown {
  merchant: string;
  total: number;
  count: number;
}

export function groupByMerchant(expenses: Expense[], topN = 5): MerchantBreakdown[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const name = (e.merchant ?? e.note ?? 'Other').trim() || 'Other';
    const cur = map.get(name) ?? { total: 0, count: 0 };
    cur.total += toNumber(e.amount);
    cur.count += 1;
    map.set(name, cur);
  }
  const rows: MerchantBreakdown[] = Array.from(map.entries()).map(([merchant, v]) => ({
    merchant,
    total: v.total,
    count: v.count,
  }));
  rows.sort((a, b) => b.total - a.total);
  return rows.slice(0, topN);
}

// ── daily series ──────────────────────────────────────────────────────────

export interface DayBucket {
  date: Date;
  key: string; // YYYY-MM-DD
  total: number;
}

/** Bucket expenses by day across the last `days` calendar days ending today (inclusive). */
export function sumByDay(expenses: Expense[], days = 14, end: Date = new Date()): DayBucket[] {
  const buckets: DayBucket[] = [];
  const endDay = startOfDay(end);
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(endDay, -i);
    buckets.push({ date: d, key: dayKey(d.toISOString()), total: 0 });
  }
  const idx = new Map<string, DayBucket>();
  for (const b of buckets) idx.set(b.key, b);
  for (const e of expenses) {
    const k = dayKey(e.occurredAt);
    const b = idx.get(k);
    if (b) b.total += toNumber(e.amount);
  }
  return buckets;
}

// ── period math ───────────────────────────────────────────────────────────

export interface PeriodTotals {
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  weekDelta: number; // (this - last) / last; 0 if last == 0
  monthDelta: number;
}

export function computePeriodTotals(expenses: Expense[], now: Date = new Date()): PeriodTotals {
  const weekStart = startOfWeek(now);
  const prevWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisWeek = sumBetween(expenses, weekStart, addDays(weekStart, 7));
  const lastWeek = sumBetween(expenses, prevWeekStart, weekStart);
  const thisMonth = sumBetween(expenses, monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const lastMonth = sumBetween(expenses, prevMonthStart, monthStart);

  const weekDelta = lastWeek > 0 ? (thisWeek - lastWeek) / lastWeek : 0;
  const monthDelta = lastMonth > 0 ? (thisMonth - lastMonth) / lastMonth : 0;

  return { thisWeek, lastWeek, thisMonth, lastMonth, weekDelta, monthDelta };
}

// ── budget progress ───────────────────────────────────────────────────────

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  pct: number; // 0..>1 if over
  status: 'ok' | 'warn' | 'bad';
}

function budgetPeriodWindow(period: Budget['period'], now: Date): { from: Date; to: Date } {
  if (period === 'weekly') {
    const from = startOfWeek(now);
    return { from, to: addDays(from, 7) };
  }
  if (period === 'yearly') {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear() + 1, 0, 1);
    return { from, to };
  }
  // monthly default
  const from = startOfMonth(now);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from, to };
}

export function computeBudgetProgress(
  budget: Budget,
  expenses: Expense[],
  now: Date = new Date(),
): BudgetProgress {
  const { from, to } = budgetPeriodWindow(budget.period, now);
  const limit = toNumber(budget.amount);
  let spent = 0;
  const fromMs = from.getTime();
  const toMs = to.getTime();
  for (const e of expenses) {
    if (budget.scope === 'category' && e.categoryId !== budget.categoryId) continue;
    if (budget.scope === 'group' && e.groupId !== budget.groupId) continue;
    const t = new Date(e.occurredAt).getTime();
    if (t < fromMs || t >= toMs) continue;
    spent += toNumber(e.amount);
  }
  const pct = limit > 0 ? spent / limit : 0;
  const alertAt = (budget.alertAt ?? 80) / 100;
  let status: BudgetProgress['status'] = 'ok';
  if (pct >= 1) status = 'bad';
  else if (pct >= alertAt) status = 'warn';
  return { budget, spent, remaining: limit - spent, pct, status };
}

// ── wallet balance (client-side, expensive at scale — used opt-in) ────────

export function walletBalance(walletId: string, openingBalance: string, expenses: Expense[]): number {
  let bal = toNumber(openingBalance);
  for (const e of expenses) {
    if (e.walletId === walletId) bal -= toNumber(e.amount);
  }
  return bal;
}

// ── reminder bucketing ────────────────────────────────────────────────────

export type ReminderBucketKey = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later';

export function bucketReminderDate(scheduledAt: string, now: Date = new Date()): ReminderBucketKey {
  const target = new Date(scheduledAt);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const endOfWeek = addDays(today, 7);
  if (target.getTime() < today.getTime()) return 'overdue';
  if (target.getTime() < tomorrow.getTime()) return 'today';
  if (target.getTime() < dayAfterTomorrow.getTime()) return 'tomorrow';
  if (target.getTime() < endOfWeek.getTime()) return 'thisWeek';
  return 'later';
}

// ── color palette for charts (matches design.md cat.*) ────────────────────

export const CHART_COLORS = [
  '#3B82F6', // primary blue
  '#F43F5E', // accent coral
  '#10B981', // cat-2 green
  '#F59E0B', // cat-3 amber
  '#8B5CF6', // cat-1 purple
  '#06B6D4', // cat-5 cyan
  '#EC4899', // cat-4 pink
  '#F97316', // cat-6 orange
];

export function colorForIndex(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length] ?? '#94A3B8';
}
