// React Query client. Single instance shared across the app.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const qk = {
  me: ['me'] as const,
  wallets: ['wallets'] as const,
  groups: ['groups'] as const,
  categories: ['categories'] as const,
  expenses: (params?: Record<string, unknown>) => ['expenses', params ?? {}] as const,
  expense: (id: string) => ['expense', id] as const,
  budgets: ['budgets'] as const,
  recurring: ['recurring'] as const,
  reminders: ['reminders'] as const,
};
