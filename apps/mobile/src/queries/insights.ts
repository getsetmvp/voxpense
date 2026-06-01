// React Query hooks for insights aggregations + settings CRUD.
// Wraps src/lib/endpoints.ts. Aggregations computed client-side via src/lib/insights.ts.

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Budget,
  Category,
  Group,
  Recurring,
  Reminder,
  Wallet,
  Expense,
} from '@voxpense/shared-types';

import {
  budgets as budgetsApi,
  categories as categoriesApi,
  expenses as expensesApi,
  groups as groupsApi,
  recurring as recurringApi,
  reminders as remindersApi,
  wallets as walletsApi,
} from '../lib/endpoints';

import { qk } from '../query/client';
import {
  computeBudgetProgress,
  computePeriodTotals,
  groupByCategory,
  groupByMerchant,
  startOfMonth,
  sumByDay,
  type BudgetProgress,
  type CategoryBreakdown,
  type DayBucket,
  type MerchantBreakdown,
  type PeriodTotals,
} from '../lib/insights';

// ── reference data ────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: qk.categories,
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useWallets() {
  return useQuery<Wallet[], Error>({
    queryKey: qk.wallets,
    queryFn: () => walletsApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useGroups() {
  return useQuery<Group[], Error>({
    queryKey: qk.groups,
    queryFn: () => groupsApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useBudgets() {
  return useQuery<Budget[], Error>({
    queryKey: qk.budgets,
    queryFn: () => budgetsApi.list(),
  });
}

export function useRecurring() {
  return useQuery<Recurring[], Error>({
    queryKey: qk.recurring,
    queryFn: () => recurringApi.list(),
  });
}

export function useReminders() {
  return useQuery<Reminder[], Error>({
    queryKey: qk.reminders,
    queryFn: () => remindersApi.list(),
  });
}

// ── insights window — pulls a recent window of expenses for aggregation ───

interface UseInsightsWindowResult {
  expenses: Expense[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  from: string;
  to: string;
}

export function useInsightsWindow(days = 30): UseInsightsWindowResult {
  // Pull expenses since `days` ago. Server may paginate — we request a single
  // large page for MVP; if user has >500 expenses in a month we still get the
  // most recent slice which is OK for charts.
  const to = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const d = new Date(to);
    d.setDate(d.getDate() - days);
    return d;
  }, [to, days]);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const params = { from: fromIso, to: toIso, limit: 200 };
  const q = useQuery({
    queryKey: qk.expenses(params),
    queryFn: () => expensesApi.list(params),
    staleTime: 60_000,
  });
  return {
    expenses: q.data?.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
    from: fromIso,
    to: toIso,
  };
}

// ── derived insight slices ────────────────────────────────────────────────

export function useExpensesByCategory(expenses: Expense[]): CategoryBreakdown[] {
  const cats = useCategories();
  return useMemo(
    () => groupByCategory(expenses, cats.data ?? []),
    [expenses, cats.data],
  );
}

export function useTopMerchants(expenses: Expense[], topN = 5): MerchantBreakdown[] {
  return useMemo(() => groupByMerchant(expenses, topN), [expenses, topN]);
}

export function useDailySpend(expenses: Expense[], days = 14): DayBucket[] {
  return useMemo(() => sumByDay(expenses, days), [expenses, days]);
}

export function usePeriodTotals(expenses: Expense[]): PeriodTotals {
  return useMemo(() => computePeriodTotals(expenses), [expenses]);
}

export function useBudgetProgress(): {
  rows: BudgetProgress[];
  isLoading: boolean;
} {
  const b = useBudgets();
  // For budgets we pull a wider window (start of month). Reuse query cache.
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const params = { from: monthStart.toISOString(), limit: 200 };
  const e = useQuery({
    queryKey: qk.expenses({ ...params, scope: 'budgets' }),
    queryFn: () => expensesApi.list(params),
    staleTime: 60_000,
  });
  const expenses = e.data?.data ?? [];
  const rows = useMemo(
    () => (b.data ?? []).map((budget) => computeBudgetProgress(budget, expenses)),
    [b.data, expenses],
  );
  return { rows, isLoading: b.isLoading || e.isLoading };
}

// ── mutations: budgets ────────────────────────────────────────────────────

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.budgets }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Budget> }) =>
      budgetsApi.update(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.budgets }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.budgets }),
  });
}

// ── mutations: recurring ──────────────────────────────────────────────────

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Recurring> }) =>
      recurringApi.update(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring }),
  });
}

// ── mutations: reminders ──────────────────────────────────────────────────

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reminders }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Reminder> & { acked?: boolean } }) =>
      remindersApi.update(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reminders }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reminders }),
  });
}

// ── mutations: categories ─────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Category> }) =>
      categoriesApi.update(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}

// ── mutations: wallets ────────────────────────────────────────────────────

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: walletsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.wallets }),
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Wallet> }) =>
      walletsApi.update(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.wallets }),
  });
}

export function useDeleteWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.wallets }),
  });
}

// ── mutations: groups ─────────────────────────────────────────────────────

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups });
      qc.invalidateQueries({ queryKey: qk.categories });
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<Group> }) =>
      groupsApi.update(vars.id, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups });
      qc.invalidateQueries({ queryKey: qk.categories });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups });
      qc.invalidateQueries({ queryKey: qk.categories });
    },
  });
}
