// 07. ExpenseListScreen — pixel-match mockup screen 07.
// Header: bold "Expenses" + search icon + filter icon (w/ active dot).
// Active filter pills row.
// Day-grouped list (section-h on left, day total on right; surf-l0 rows).
// Floating brand FAB (right-bottom, anchored above tab bar).

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Input } from '../../src/components/glass';
import {
  EmptyExpenses,
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
import { formatCurrency } from '../../src/lib/format';

export default function ExpensesScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  // ── filter + search state ────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // ── derive query params from filters ─────────────────────────────────────
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

  // ── ref data ────────────────────────────────────────────────────────────
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

  // ── pills ───────────────────────────────────────────────────────────────
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
  const brand = isDark ? '#60A5FA' : '#3B82F6';

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
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: ink,
            letterSpacing: -0.3,
          }}
        >
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
            style={({ pressed }) => [
              expStyles.headerBtn,
              {
                backgroundColor: searchOpen
                  ? isDark
                    ? 'rgba(96,165,250,0.22)'
                    : 'rgba(59,130,246,0.14)'
                  : isDark
                    ? 'rgba(31,41,55,0.7)'
                    : 'rgba(241,244,248,1)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={searchOpen ? brand : ink}
            />
          </Pressable>
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityLabel="Open filters"
            style={({ pressed }) => [
              expStyles.headerBtn,
              {
                backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="options" size={18} color={ink} />
            {pills.length > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: brand,
                }}
              />
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Search input */}
      {searchOpen ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
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
      ) : null}

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
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: meta,
                  }}
                >
                  {item.group.label}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: ink,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatCurrency(item.group.total, currency)}
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20, paddingVertical: 3 }}>
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
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 2 }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => list.refetch()}
              tintColor={brand}
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
                <ActivityIndicator color={brand} />
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

      {/* FAB → voice capture (anchored above glass tab bar) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          elevation: 12,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: 20,
            bottom: 96,
            width: 56,
            height: 56,
          }}
        >
          <Pressable
            onPress={() => router.push('/(capture)/voice')}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            style={({ pressed }) => [
              expStyles.fab,
              {
                backgroundColor: brand,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

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
    <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}>
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

const expStyles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
