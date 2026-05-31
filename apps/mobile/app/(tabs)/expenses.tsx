// 07. ExpenseListScreen
// FlatList with day-grouped headers, infinite-scroll cursor pagination,
// debounced search, glass filter sheet, active-filter pill row.

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Input } from '../../src/components/glass';
import {
  EmptyExpenses,
  ExpenseGroupHeader,
  ExpenseRow,
  FilterPills,
  FilterSheet,
  emptyFilters,
  groupByDay,
  toListRows,
  type FilterPill,
  type FilterValues,
  type ListRow,
} from '../../src/components/expense';
import { flattenPages, useExpensesList } from '../../src/queries/expenses';
import {
  useCategories,
  useGroups,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { rangeForPreset, DATE_PRESETS } from '../../src/hooks/useDateRange';

export default function ExpensesScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  // ── filter + search state ───────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // ── derive query params from filters ────────────────────────────────────
  const range = useMemo(() => rangeForPreset(filters.preset), [filters.preset]);
  const listParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      category_id: filters.categoryId ?? undefined,
      wallet_id: filters.walletId ?? undefined,
      group_id: filters.groupId ?? undefined,
      q: debouncedQ.length > 0 ? debouncedQ : undefined,
      limit: 30,
    }),
    [range, filters, debouncedQ],
  );

  const list = useExpensesList(listParams);
  const expenses = flattenPages(list.data);

  const groups = useMemo(() => groupByDay(expenses), [expenses]);
  const rows: ListRow[] = useMemo(() => toListRows(groups), [groups]);

  // ── ref data for row decoration ─────────────────────────────────────────
  const categoriesQ = useCategories();
  const walletsQ = useWallets();
  const groupsQ = useGroups();
  const categoryById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof categoriesQ.data>[number]>();
    (categoriesQ.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [categoriesQ.data]);
  const walletById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof walletsQ.data>[number]>();
    (walletsQ.data ?? []).forEach((w) => m.set(w.id, w));
    return m;
  }, [walletsQ.data]);

  // ── active filter pills ─────────────────────────────────────────────────
  const pills: FilterPill[] = useMemo(() => {
    const out: FilterPill[] = [];
    if (filters.preset !== 'all') {
      const presetDef = DATE_PRESETS.find((p) => p.id === filters.preset);
      if (presetDef) {
        out.push({
          key: 'preset',
          label: presetDef.label,
          onRemove: () => setFilters((f) => ({ ...f, preset: 'all' })),
        });
      }
    }
    if (filters.categoryId) {
      const c = categoryById.get(filters.categoryId);
      out.push({
        key: 'category',
        label: c?.name ?? 'Category',
        onRemove: () => setFilters((f) => ({ ...f, categoryId: null })),
      });
    }
    if (filters.walletId) {
      const w = walletById.get(filters.walletId);
      out.push({
        key: 'wallet',
        label: w?.name ?? 'Wallet',
        onRemove: () => setFilters((f) => ({ ...f, walletId: null })),
      });
    }
    if (filters.groupId) {
      const g = (groupsQ.data ?? []).find((it) => it.id === filters.groupId);
      out.push({
        key: 'group',
        label: g?.name ?? 'Group',
        onRemove: () => setFilters((f) => ({ ...f, groupId: null })),
      });
    }
    return out;
  }, [filters, categoryById, walletById, groupsQ.data]);

  const hasAnyFilter = pills.length > 0 || debouncedQ.length > 0;
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: ink }}>Expenses</Text>
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
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: searchOpen
                ? isDark
                  ? 'rgba(96,165,250,0.22)'
                  : 'rgba(59,130,246,0.14)'
                : isDark
                  ? 'rgba(31,41,55,0.7)'
                  : 'rgba(255,255,255,0.7)',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Ionicons
              name="search"
              size={18}
              color={searchOpen ? (isDark ? '#60A5FA' : '#3B82F6') : ink}
            />
          </Pressable>
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityLabel="Open filters"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(255,255,255,0.7)',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Ionicons name="options" size={18} color={ink} />
            {pills.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#3B82F6',
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Search input */}
      {searchOpen && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Input
            placeholder="Search merchant or note"
            value={searchInput}
            onChangeText={setSearchInput}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            leftIcon={<Ionicons name="search" size={16} color={meta} />}
            rightIcon={
              searchInput.length > 0 ? (
                <Pressable onPress={() => setSearchInput('')}>
                  <Ionicons name="close-circle" size={16} color={meta} />
                </Pressable>
              ) : null
            }
          />
        </View>
      )}

      {/* Active filter pills */}
      <FilterPills pills={pills} />

      {/* List */}
      {list.isLoading ? (
        <SkeletonList isDark={isDark} />
      ) : list.isError ? (
        <View style={{ padding: 24 }}>
          <Pressable
            onPress={() => list.refetch()}
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.10)',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.35)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={{ flex: 1, color: isDark ? '#FECACA' : '#B91C1C', fontSize: 14 }}>
              Couldn't load expenses. Tap to retry.
            </Text>
          </Pressable>
        </View>
      ) : rows.length === 0 ? (
        <EmptyExpenses
          hasFilters={hasAnyFilter}
          onClearFilters={() => {
            setFilters(emptyFilters);
            setSearchInput('');
            setDebouncedQ('');
          }}
          onAdd={() => router.push('/(capture)/voice')}
        />
      ) : (
        <FlatList<ListRow>
          data={rows}
          keyExtractor={keyForRow}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <View style={{ paddingHorizontal: 16 }}>
                <ExpenseGroupHeader
                  label={item.group.label}
                  total={item.group.total}
                  currency={currency}
                />
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16, paddingVertical: 3 }}>
                <ExpenseRow
                  expense={item.expense}
                  currency={currency}
                  category={
                    item.expense.categoryId
                      ? categoryById.get(item.expense.categoryId)
                      : undefined
                  }
                  wallet={walletById.get(item.expense.walletId)}
                  onPress={() => router.push(`/expense/${item.expense.id}`)}
                />
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => list.refetch()}
              tintColor={isDark ? '#60A5FA' : '#3B82F6'}
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
                <ActivityIndicator color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
            ) : !list.hasNextPage && rows.length > 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: meta, fontSize: 11, fontWeight: '600' }}>
                  · end ·
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB → voice capture */}
      <Pressable
        onPress={() => router.push('/(capture)/voice')}
        accessibilityLabel="Add expense"
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 100,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#3B82F6',
          shadowOpacity: 0.45,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Filter sheet */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filters}
        onApply={(v) => setFilters(v)}
        categories={categoriesQ.data ?? []}
        wallets={walletsQ.data ?? []}
        groups={groupsQ.data ?? []}
      />
    </Screen>
  );
}

function keyForRow(row: ListRow): string {
  return row.kind === 'header' ? `h:${row.group.dayKey}` : `e:${row.expense.id}`;
}

function SkeletonList({ isDark }: { isDark: boolean }) {
  const bar = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
      <View
        style={{
          height: 14,
          width: 80,
          borderRadius: 7,
          backgroundColor: bar,
          marginVertical: 10,
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            borderRadius: 14,
            backgroundColor: isDark ? 'rgba(31,41,55,0.5)' : 'rgba(255,255,255,0.6)',
            gap: 12,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bar }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View
              style={{ height: 10, width: '60%', borderRadius: 5, backgroundColor: bar }}
            />
            <View
              style={{ height: 8, width: '40%', borderRadius: 4, backgroundColor: bar }}
            />
          </View>
          <View style={{ height: 12, width: 60, borderRadius: 6, backgroundColor: bar }} />
        </View>
      ))}
    </View>
  );
}
