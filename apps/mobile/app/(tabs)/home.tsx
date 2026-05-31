// 06. HomeScreen
// Top: greeting + this-week total spend
// Mid: 4 quick-action tiles → voice / photo / manual / budget
// Bottom: recent 5 expenses (day-grouped) + "See all" link → /(tabs)/expenses

import { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Card, Screen } from '../../src/components/glass';
import {
  AmountDisplay,
  EmptyExpenses,
  ExpenseGroupHeader,
  ExpenseRow,
  groupByDay,
} from '../../src/components/expense';
import {
  flattenPages,
  useExpensesList,
} from '../../src/queries/expenses';
import {
  useCategories,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { rangeForPreset } from '../../src/hooks/useDateRange';
import { toNumber } from '../../src/lib/insights';

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href:
    | '/(capture)/voice'
    | '/(capture)/photo'
    | '/(capture)/manual'
    | '/(tabs)/insights';
  primary?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'voice', label: 'Voice', icon: 'mic', href: '/(capture)/voice', primary: true },
  { key: 'photo', label: 'Receipt', icon: 'camera', href: '/(capture)/photo' },
  { key: 'manual', label: 'Manual', icon: 'create', href: '/(capture)/manual' },
  { key: 'budget', label: 'Budgets', icon: 'pie-chart', href: '/(tabs)/insights' },
];

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const week = useMemo(() => rangeForPreset('thisWeek'), []);

  const list = useExpensesList({ from: week.from, to: week.to, limit: 50 });
  const expenses = flattenPages(list.data);

  const weekTotal = useMemo(
    () => expenses.reduce((acc, e) => acc + toNumber(e.amount), 0),
    [expenses],
  );

  // Recent 5: most recent expenses, day-grouped.
  const recentGroups = useMemo(() => {
    if (expenses.length === 0) return [];
    const recentItems = expenses.slice(0, 5);
    return groupByDay(recentItems);
  }, [expenses]);

  const categoriesQ = useCategories();
  const walletsQ = useWallets();
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

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const userName = user?.name?.trim() || 'there';
  const greeting = greetingFor(new Date());
  const todayLabel = format(new Date(), 'EEEE, d MMMM');

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => list.refetch()}
            tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
        }
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: meta, fontWeight: '500' }}>
              {todayLabel}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: ink,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {greeting}, {userName}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings/reminders')}
            accessibilityLabel="Reminders"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(255,255,255,0.7)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="notifications-outline" size={20} color={ink} />
          </Pressable>
        </View>

        {/* Week summary */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Card>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: meta,
              }}
            >
              This week
            </Text>
            <View style={{ marginTop: 8 }}>
              <AmountDisplay amount={weekTotal} currency={currency} size="xl" />
            </View>
            <Text style={{ fontSize: 12, color: meta, marginTop: 6 }}>
              {expenses.length}{' '}
              {expenses.length === 1 ? 'expense' : 'expenses'} ·{' '}
              {week.label.toLowerCase()}
            </Text>
          </Card>
        </View>

        {/* Quick actions */}
        <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: meta,
              marginBottom: 10,
            }}
          >
            Quick add
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {QUICK_ACTIONS.map((qa) => (
              // Outer column owns the flex slot; Pressable fills it 100% so the
              // tap target exactly matches the visual tile (no drift from
              // transform/scale on the pressable itself).
              <View
                key={qa.key}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 22,
                  backgroundColor: qa.primary
                    ? isDark
                      ? '#60A5FA'
                      : '#3B82F6'
                    : isDark
                      ? 'rgba(31,41,55,0.7)'
                      : 'rgba(255,255,255,0.85)',
                  borderWidth: qa.primary ? 0 : 1,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.06)',
                  shadowColor: qa.primary ? '#3B82F6' : '#000',
                  shadowOpacity: qa.primary ? 0.3 : 0.05,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: qa.primary ? 6 : 2,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => router.push(qa.href)}
                  accessibilityLabel={qa.label}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: '100%',
                    height: '100%',
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons
                    name={qa.icon}
                    size={26}
                    color={qa.primary ? '#FFFFFF' : ink}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: qa.primary ? '#FFFFFF' : ink,
                      marginTop: 8,
                    }}
                  >
                    {qa.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Recent */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 4,
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
              Recent
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/expenses')}
              accessibilityLabel="See all expenses"
            >
              <Text
                style={{
                  color: isDark ? '#60A5FA' : '#3B82F6',
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                See all →
              </Text>
            </Pressable>
          </View>

          {list.isLoading ? (
            <SkeletonRows isDark={isDark} count={3} />
          ) : list.isError ? (
            <ErrorBanner
              isDark={isDark}
              onRetry={() => list.refetch()}
              message="Couldn't load this week's expenses."
            />
          ) : recentGroups.length === 0 ? (
            <EmptyExpenses
              hasFilters={false}
              compact
              onAdd={() => router.push('/(capture)/voice')}
            />
          ) : (
            <View style={{ marginTop: 4 }}>
              {recentGroups.map((g) => (
                <View key={g.dayKey}>
                  <ExpenseGroupHeader
                    label={g.label}
                    total={g.total}
                    currency={currency}
                  />
                  <View style={{ gap: 6 }}>
                    {g.items.map((exp) => (
                      <ExpenseRow
                        key={exp.id}
                        expense={exp}
                        currency={currency}
                        category={
                          exp.categoryId ? categoryById.get(exp.categoryId) : undefined
                        }
                        wallet={walletById.get(exp.walletId)}
                        onPress={() => router.push(`/expense/${exp.id}`)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SkeletonRows({ isDark, count }: { isDark: boolean; count: number }) {
  const bar = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
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
            <View style={{ height: 10, width: '60%', borderRadius: 5, backgroundColor: bar }} />
            <View style={{ height: 8, width: '40%', borderRadius: 4, backgroundColor: bar }} />
          </View>
          <View style={{ height: 12, width: 60, borderRadius: 6, backgroundColor: bar }} />
        </View>
      ))}
    </View>
  );
}

function ErrorBanner({
  isDark,
  message,
  onRetry,
}: {
  isDark: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Pressable
      onPress={onRetry}
      style={({ pressed }) => ({
        marginTop: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.35)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name="alert-circle" size={18} color="#EF4444" />
      <Text style={{ flex: 1, color: isDark ? '#FECACA' : '#B91C1C', fontSize: 13 }}>
        {message}
      </Text>
      <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Retry</Text>
    </Pressable>
  );
}
