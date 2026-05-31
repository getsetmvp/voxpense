// React Query hooks for expense CRUD. Wraps src/lib/endpoints.ts `expenses`.
// All server state for the expense feature lives here.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Expense } from '@voxpense/shared-types';

import {
  expenses as expensesApi,
  type CreateExpenseBody,
  type ExpenseListParams,
  type ExpenseListResult,
} from '../lib/endpoints';
import { qk } from '../query/client';

// ── list (infinite) ───────────────────────────────────────────────────────

export interface UseExpensesListInput extends Omit<ExpenseListParams, 'cursor' | 'limit'> {
  limit?: number;
  enabled?: boolean;
}

export function useExpensesList(input: UseExpensesListInput = {}) {
  const { limit = 30, enabled = true, ...filters } = input;
  return useInfiniteQuery<
    ExpenseListResult,
    Error,
    InfiniteData<ExpenseListResult>,
    ReturnType<typeof qk.expenses>,
    string | undefined
  >({
    queryKey: qk.expenses({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      expensesApi.list({ ...filters, limit, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
  });
}

/** Flatten paginated infinite-query data into a flat Expense[]. */
export function flattenPages(
  data: InfiniteData<ExpenseListResult> | undefined,
): Expense[] {
  if (!data) return [];
  return data.pages.flatMap((p) => p.data);
}

// ── single ────────────────────────────────────────────────────────────────

export function useExpense(id: string | undefined) {
  return useQuery<Expense, Error>({
    queryKey: qk.expense(id ?? ''),
    queryFn: () => expensesApi.get(id!),
    enabled: !!id,
  });
}

// ── mutations ─────────────────────────────────────────────────────────────

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation<Expense, Error, CreateExpenseBody>({
    mutationFn: (body) => expensesApi.create(body),
    onSuccess: () => {
      // Invalidate every expenses list variant.
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export interface UpdateExpenseVars {
  id: string;
  body: Partial<CreateExpenseBody>;
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation<Expense, Error, UpdateExpenseVars>({
    mutationFn: ({ id, body }) => expensesApi.update(id, body),
    onSuccess: (updated, vars) => {
      qc.setQueryData(qk.expense(vars.id), updated);
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expensesApi.remove(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: qk.expense(id) });
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
