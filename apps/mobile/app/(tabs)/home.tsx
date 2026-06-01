// 06. HomeScreen — pixel-match mockup screen 06.
// Top: dayLabel + greeting + bell button.
// Hero: TODAY'S SPENDING section-h + huge tnum amount (₹X.XX) + delta chip.
// Glass card: THIS WEEK + week delta + total + 7-day sparkline.
// Quick add: 3 tiles aspect-3/4, Voice = brand+white, others = surf-l0.
// Recent: header + "See all →" link + last 2 expenses.

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
  EmptyExpenses,
  ExpenseRow,
} from '../../src/components/expense';
import { Chip } from '../../src/components/home/Chip';
import { WeekSparkline } from '../../src/components/home/WeekSparkline';
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
import { addDays, startOfDay, startOfWeek, toNumber } from '../../src/lib/insights';
import { formatCurrency } from '../../src/lib/format';

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/(capture)/voice' | '/(capture)/photo' | '/(capture)/manual';
  primary?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'voice', label: 'Voice', icon: 'mic', href: '/(capture)/voice', primary: true },
  { key: 'photo', label: 'Receipt', icon: 'camera', href: '/(capture)/photo' },
  { key: 'manual', label: 'Manual', icon: 'create', href: '/(capture)/manual' },
];

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function splitAmount(amount: number, currency: string): { head: string; tail: string } {
  const formatted = formatCurrency(amount, currency);
  const dot = formatted.lastIndexOf('.');
  if (dot < 0) return { head: formatted, tail: '' };
  return { head: formatted.slice(0, dot), tail: formatted.slice(dot) };
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  // Pull this week's expenses (covers Today + week card + recent list).
  const week = useMemo(() => rangeForPreset('thisWeek'), []);
  const list = useExpensesList({ from: week.from, to: week.to, limit: 100 });
  const expenses = flattenPages(list.data);

  // ── derive today / yesterday / week totals + 7-day sparkline ───────────
  const { todayTotal, yesterdayTotal, weekTotal, dailyValues } = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    const weekStart = startOfWeek(now);

    let tToday = 0;
    let tYesterday = 0;
    let tWeek = 0;
    const buckets = new Array<number>(7).fill(0);

    for (const e of expenses) {
      const ts = new Date(e.occurredAt);
      const amt = toNumber(e.amount);
      if (ts >= today && ts < tomorrow) tToday += amt;
      else if (ts >= yesterday && ts < today) tYesterday += amt;
      if (ts >= weekStart) {
        tWeek += amt;
        const idx = Math.min(
          6,
          Math.max(0, Math.floor((ts.getTime() - weekStart.getTime()) / 86_400_000)),
        );
        buckets[idx] = (buckets[idx] ?? 0) + amt;
      }
    }

    return {
      todayTotal: tToday,
      yesterdayTotal: tYesterday,
      weekTotal: tWeek,
      dailyValues: buckets,
    };
  }, [expenses]);

  // Reference data for row decoration
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

  // Recent 2 expenses (most-recent first)
  const recent = useMemo(() => expenses.slice(0, 2), [expenses]);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const brand = isDark ? '#60A5FA' : '#3B82F6';
  const tileBg = isDark ? '#111827' : '#FFFFFF';

  const userName = user?.name?.trim() || 'there';
  const greeting = greetingFor(new Date());
  const todayDateLabel = format(new Date(), 'EEEE, d MMMM');

  // Hero amount split (₹1,240 + .50)
  const { head: heroHead, tail: heroTail } = splitAmount(todayTotal, currency);

  // Today vs yesterday delta
  const todayDelta = todayTotal - yesterdayTotal;
  const todayDeltaLabel = (() => {
    if (yesterdayTotal === 0 && todayTotal === 0) return null;
    const sign = todayDelta >= 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(todayDelta), currency)} vs yesterday`;
  })();
  const todayDeltaUp = todayDelta >= 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => list.refetch()}
            tintColor={brand}
          />
        }
      >
        {/* Top bar: date + greeting + bell */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, color: meta }}>{todayDateLabel}</Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: ink,
                marginTop: 2,
              }}
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
              backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="notifications-outline" size={20} color={ink} />
          </Pressable>
        </View>

        {/* Today's spending hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: meta,
            }}
          >
            Today's spending
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 44,
                fontWeight: '700',
                color: ink,
                letterSpacing: -0.8,
                lineHeight: 48,
                fontVariant: ['tabular-nums'],
              }}
            >
              {heroHead}
            </Text>
            {heroTail ? (
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '500',
                  color: meta,
                  marginLeft: 1,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {heroTail}
              </Text>
            ) : null}
          </View>
          {todayDeltaLabel ? (
            <View style={{ marginTop: 8 }}>
              <Chip
                icon={todayDeltaUp ? 'trending-up' : 'trending-down'}
                label={todayDeltaLabel}
                bg={todayDeltaUp ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'}
                fg={todayDeltaUp ? '#F59E0B' : '#10B981'}
              />
            </View>
          ) : null}
        </View>

        {/* This week glass card */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Card rounded="xl">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
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
                This week
              </Text>
              {expenses.length > 0 ? (
                <Chip
                  icon="trending-down"
                  label={`${expenses.length} ${expenses.length === 1 ? 'entry' : 'entries'}`}
                  bg="rgba(16,185,129,0.12)"
                  fg="#10B981"
                />
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: ink,
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatCurrency(weekTotal, currency)}
            </Text>
            <View style={{ marginTop: 8 }}>
              <WeekSparkline values={dailyValues} />
            </View>
          </Card>
        </View>

        {/* Quick add tiles */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
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
              <View
                key={qa.key}
                style={{
                  flex: 1,
                  aspectRatio: 3 / 4,
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: qa.primary ? brand : tileBg,
                  borderWidth: qa.primary ? 0 : 1,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.06)',
                  shadowColor: qa.primary ? '#3B82F6' : '#000',
                  shadowOpacity: qa.primary ? 0.3 : 0.06,
                  shadowRadius: qa.primary ? 18 : 14,
                  shadowOffset: { width: 0, height: qa.primary ? 12 : 6 },
                  elevation: qa.primary ? 8 : 3,
                }}
              >
                <Pressable
                  onPress={() => router.push(qa.href)}
                  accessibilityRole="button"
                  accessibilityLabel={qa.label}
                  style={({ pressed }) => ({
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons
                    name={qa.icon}
                    size={28}
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

        {/* Recent expenses */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 6,
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
              hitSlop={6}
            >
              <Text style={{ color: brand, fontSize: 11, fontWeight: '600' }}>
                See all →
              </Text>
            </Pressable>
          </View>

          {list.isLoading ? (
            <SkeletonRows isDark={isDark} count={2} />
          ) : list.isError ? (
            <ErrorBanner
              isDark={isDark}
              onRetry={() => list.refetch()}
              message="Couldn't load this week's expenses."
            />
          ) : recent.length === 0 ? (
            <EmptyExpenses
              hasFilters={false}
              compact
              onAdd={() => router.push('/(capture)/voice')}
            />
          ) : (
            <View style={{ gap: 4 }}>
              {recent.map((exp) => (
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
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SkeletonRows({ isDark, count }: { isDark: boolean; count: number }) {
  const bar = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
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
        marginTop: 8,
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
