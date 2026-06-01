// Expense list tab — mockup 14. Day-grouped FlatList with header
// (title + search + filter), active filter pills row, EmptyState, brand FAB.

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '../../src/components/layout/Screen';
import { Chip } from '../../src/components/ui/Chip';
import { Input } from '../../src/components/ui/Input';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ExpenseRow } from '../../src/components/feature/ExpenseRow';
import {
  FilterSheet,
  type ExpenseListFilter,
} from '../../src/components/feature/FilterSheet';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  flattenPages,
  useExpensesList,
} from '../../src/queries/expenses';
import {
  useGroups,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';
import { toNumber } from '../../src/lib/insights';
import type { Expense } from '@voxpense/shared-types';

type DayBucket = { date: string; total: number; items: Expense[] };
type Row =
  | { kind: 'header'; bucket: DayBucket }
  | { kind: 'expense'; expense: Expense; isFirst: boolean; isLast: boolean };

function groupByDay(list: Expense[]): DayBucket[] {
  const map = new Map<string, Expense[]>();
  for (const e of list) {
    const day = e.occurredAt.slice(0, 10);
    map.set(day, [...(map.get(day) ?? []), e]);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => ({
      date: day,
      items,
      total: items.reduce((a, b) => a + toNumber(b.amount), 0),
    }));
}

function formatDayLabel(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round((today.getTime() - targetDay.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7 && diff > 0) {
    return targetDay.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return targetDay.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: targetDay.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export default function ExpensesTab() {
  const { tokens } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const [filter, setFilter] = useState<ExpenseListFilter>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Parse incoming `?filter=` (e.g. coming from Ask screen)
  useEffect(() => {
    const raw = params.filter;
    if (typeof raw !== 'string') return;
    try {
      const parsed = JSON.parse(raw);
      setFilter((f) => ({ ...f, ...parsed }));
    } catch {
      // ignore
    }
  }, [params.filter]);

  // Pull groups/wallets for label resolution + ExpenseRow rendering
  const groupsQ = useGroups();
  const walletsQ = useWallets();
  const groupById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof groupsQ.data>[number]>();
    (groupsQ.data ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [groupsQ.data]);
  const walletById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof walletsQ.data>[number]>();
    (walletsQ.data ?? []).forEach((w) => m.set(w.id, w));
    return m;
  }, [walletsQ.data]);

  // Server-side filters (group, wallet, search). `source` filtered client-side.
  const listParams = useMemo(
    () => ({
      group_id: filter.groupId ?? undefined,
      wallet_id: filter.walletId ?? undefined,
      q: debouncedQ.length > 0 ? debouncedQ : undefined,
      limit: 30,
    }),
    [filter.groupId, filter.walletId, debouncedQ],
  );

  const list = useExpensesList(listParams);
  const allExpenses = flattenPages(list.data);
  const expenses = useMemo(() => {
    if (!filter.source) return allExpenses;
    return allExpenses.filter((e) => e.source === filter.source);
  }, [allExpenses, filter.source]);

  const buckets = useMemo(() => groupByDay(expenses), [expenses]);
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const b of buckets) {
      out.push({ kind: 'header', bucket: b });
      b.items.forEach((e, i) => {
        out.push({
          kind: 'expense',
          expense: e,
          isFirst: i === 0,
          isLast: i === b.items.length - 1,
        });
      });
    }
    return out;
  }, [buckets]);

  // Active filter pills (each renders as a Chip with X)
  const pills = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = [];
    if (filter.groupId) {
      const g = groupById.get(filter.groupId);
      out.push({
        key: 'group',
        label: g?.name ?? 'Group',
        onRemove: () => setFilter((f) => ({ ...f, groupId: null })),
      });
    }
    if (filter.walletId) {
      const w = walletById.get(filter.walletId);
      out.push({
        key: 'wallet',
        label: w?.name ?? 'Wallet',
        onRemove: () => setFilter((f) => ({ ...f, walletId: null })),
      });
    }
    if (filter.source) {
      out.push({
        key: 'source',
        label: filter.source.charAt(0).toUpperCase() + filter.source.slice(1),
        onRemove: () => setFilter((f) => ({ ...f, source: undefined })),
      });
    }
    return out;
  }, [filter, groupById, walletById]);

  const hasActiveFilters = pills.length > 0;

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.ink }}>
          Expenses
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              setSearchOpen((v) => {
                if (v) {
                  setSearchInput('');
                  setDebouncedQ('');
                }
                return !v;
              });
            }}
            accessibilityLabel="Toggle search"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: searchOpen ? `${tokens.brand}1A` : tokens.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search size={18} color={searchOpen ? tokens.brand : tokens.ink} />
          </Pressable>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityLabel="Open filters"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={18} color={tokens.ink} />
            {hasActiveFilters ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: tokens.brand,
                }}
              />
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Search bar (toggled) */}
      {searchOpen ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Input
            placeholder="Search merchant or note"
            value={searchInput}
            onChangeText={setSearchInput}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      ) : null}

      {/* Active filter pills */}
      {pills.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {pills.map((p) => (
            <Pressable key={p.key} onPress={p.onRemove}>
              <Chip
                label={p.label}
                variant="brand"
                icon={<X size={12} color={tokens.brand} />}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* List */}
      {list.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.brand} />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No expenses match"
          body={
            hasActiveFilters || debouncedQ.length > 0
              ? 'Adjust filters or clear search.'
              : 'Tap the + button to add your first expense.'
          }
        />
      ) : (
        <FlatList<Row>
          data={rows}
          keyExtractor={(r, idx) =>
            r.kind === 'header' ? `h:${r.bucket.date}` : `e:${r.expense.id}:${idx}`
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => list.refetch()}
              tintColor={tokens.brand}
              colors={[tokens.brand]}
            />
          }
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={tokens.brand} />
              </View>
            ) : null
          }
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  paddingBottom: 6,
                }}
              >
                <Text
                  style={{
                    color: tokens.muted,
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {formatDayLabel(item.bucket.date)}
                </Text>
                <Text
                  style={{
                    color: tokens.muted,
                    fontVariant: ['tabular-nums'],
                    fontSize: 12,
                    fontWeight: '500',
                  }}
                >
                  {formatCurrency(item.bucket.total, currency)}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: tokens.surface,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: tokens.border,
                  borderTopWidth: item.isFirst ? 1 : 0,
                  borderBottomWidth: item.isLast ? 1 : 0,
                  borderTopLeftRadius: item.isFirst ? 16 : 0,
                  borderTopRightRadius: item.isFirst ? 16 : 0,
                  borderBottomLeftRadius: item.isLast ? 16 : 0,
                  borderBottomRightRadius: item.isLast ? 16 : 0,
                  overflow: 'hidden',
                }}
              >
                <ExpenseRow
                  expense={item.expense}
                  group={
                    item.expense.groupId
                      ? groupById.get(item.expense.groupId) ?? null
                      : null
                  }
                  wallet={walletById.get(item.expense.walletId) ?? null}
                />
                {!item.isLast ? (
                  <View
                    style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
                  />
                ) : null}
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB → manual capture */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 96,
        }}
      >
        <Pressable
          onPress={() => router.push('/(capture)/manual')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: tokens.brand,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: tokens.brand,
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Plus size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter sheet */}
      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filter}
        onChange={setFilter}
      />
    </Screen>
  );
}
