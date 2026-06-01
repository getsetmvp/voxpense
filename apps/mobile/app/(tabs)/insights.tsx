// Insights / Reports tab — mockup 20.
// Period picker (Week / Month / Year), total + delta vs previous,
// daily spend bar chart (simple Views), top categories w/ progress, top merchants.
// No AI Ask panel here — it's its own tab.

import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Amount } from '../../src/components/ui/Amount';
import { Chip } from '../../src/components/ui/Chip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import {
  useExpensesByCategory,
  useInsightsWindow,
  useTopMerchants,
} from '../../src/queries/insights';
import { formatCurrency } from '../../src/lib/format';
import { sumByDay, sumBetween, toNumber } from '../../src/lib/insights';

type Period = 'week' | 'month' | 'year';

const PERIODS: { id: Period; label: string; days: number; barDays: number }[] = [
  { id: 'week', label: 'Week', days: 14, barDays: 7 },
  { id: 'month', label: 'Month', days: 60, barDays: 30 },
  { id: 'year', label: 'Year', days: 365, barDays: 12 },
];

function periodWindow(period: Period, now: Date = new Date()): {
  curFrom: Date;
  curTo: Date;
  prevFrom: Date;
  prevTo: Date;
} {
  const curTo = new Date(now);
  curTo.setHours(23, 59, 59, 999);
  if (period === 'week') {
    const curFrom = new Date(curTo);
    curFrom.setDate(curFrom.getDate() - 6);
    curFrom.setHours(0, 0, 0, 0);
    const prevTo = new Date(curFrom);
    prevTo.setMilliseconds(prevTo.getMilliseconds() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - 6);
    prevFrom.setHours(0, 0, 0, 0);
    return { curFrom, curTo, prevFrom, prevTo };
  }
  if (period === 'month') {
    const curFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 1);
    prevTo.setMilliseconds(prevTo.getMilliseconds() - 1);
    return { curFrom, curTo, prevFrom, prevTo };
  }
  // year
  const curFrom = new Date(now.getFullYear(), 0, 1);
  const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
  const prevTo = new Date(now.getFullYear(), 0, 1);
  prevTo.setMilliseconds(prevTo.getMilliseconds() - 1);
  return { curFrom, curTo, prevFrom, prevTo };
}

export default function InsightsTab() {
  const { tokens } = useTheme();
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const [period, setPeriod] = useState<Period>('month');
  const cfg = (PERIODS.find((p) => p.id === period) ?? PERIODS[1])!;

  const win = useInsightsWindow(cfg.days);
  const expenses = win.expenses;

  // Filter to current vs previous-period windows for delta math
  const { curFrom, curTo, prevFrom, prevTo } = useMemo(
    () => periodWindow(period),
    [period],
  );
  const curExpenses = useMemo(
    () => expenses.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      return t >= curFrom.getTime() && t <= curTo.getTime();
    }),
    [expenses, curFrom, curTo],
  );

  const total = useMemo(
    () => curExpenses.reduce((a, b) => a + toNumber(b.amount), 0),
    [curExpenses],
  );
  const prevTotal = useMemo(
    () => sumBetween(expenses, prevFrom, prevTo),
    [expenses, prevFrom, prevTo],
  );
  const delta = prevTotal > 0 ? (total - prevTotal) / prevTotal : 0;
  const deltaUp = delta >= 0;

  // Daily spend bars
  const dailyBars = useMemo(() => {
    const series = sumByDay(curExpenses, cfg.barDays);
    const max = Math.max(1, ...series.map((b) => b.total));
    return series.map((b) => ({
      key: b.key,
      label: b.date.getDate().toString(),
      value: b.total,
      heightPct: Math.max(0.04, b.total / max),
    }));
  }, [curExpenses, cfg.barDays]);

  // Top categories
  const byCategory = useExpensesByCategory(curExpenses);
  const topCats = byCategory.slice(0, 5);
  const catTotal = topCats.reduce((a, b) => a + b.total, 0);

  // Top merchants
  const topMerchants = useTopMerchants(curExpenses, 5);

  const previousLabel =
    period === 'week'
      ? 'last week'
      : period === 'month'
        ? 'last month'
        : 'last year';

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.ink }}>
          Insights
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={win.isLoading}
            onRefresh={() => win.refetch()}
            tintColor={tokens.brand}
            colors={[tokens.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period picker */}
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPeriod(p.id)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? tokens.brand : tokens.border,
                  backgroundColor: active ? `${tokens.brand}1A` : tokens.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: active ? tokens.brand : tokens.ink,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {win.expenses.length === 0 && !win.isLoading ? (
          <EmptyState
            title="No expenses yet"
            body="Log your first expense to see your spending insights."
          />
        ) : (
          <>
            {/* Total + delta card */}
            <View
              style={{
                borderRadius: 16,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: tokens.muted,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Total spend
                </Text>
                {prevTotal > 0 ? (
                  <Chip
                    label={`${deltaUp ? '+' : ''}${Math.round(delta * 100)}% vs ${previousLabel}`}
                    variant={deltaUp ? 'warn' : 'good'}
                    icon={
                      deltaUp ? (
                        <TrendingUp size={10} color={tokens.warn} />
                      ) : (
                        <TrendingDown size={10} color={tokens.good} />
                      )
                    }
                  />
                ) : null}
              </View>
              <View style={{ marginTop: 6 }}>
                <Amount value={total} currency={currency} size={28} weight="700" />
              </View>

              {/* Daily spend bar chart */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 4,
                  alignItems: 'flex-end',
                  height: 96,
                  marginTop: 16,
                }}
              >
                {dailyBars.map((b) => (
                  <View
                    key={b.key}
                    style={{
                      flex: 1,
                      height: `${b.heightPct * 100}%`,
                      backgroundColor: `${tokens.brand}66`,
                      borderRadius: 6,
                    }}
                  />
                ))}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: tokens.muted,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                Daily spend · last {cfg.barDays} days
              </Text>
            </View>

            {/* Top categories */}
            <SectionHeader>Top categories</SectionHeader>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {topCats.length === 0 ? (
                <Text
                  style={{
                    padding: 20,
                    color: tokens.muted,
                    textAlign: 'center',
                    fontSize: 13,
                  }}
                >
                  No categorized spend in this window.
                </Text>
              ) : (
                topCats.map((c, i) => {
                  const pct = catTotal > 0 ? c.total / catTotal : 0;
                  return (
                    <View
                      key={c.categoryId ?? `u-${i}`}
                      style={{
                        padding: 14,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: tokens.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            flex: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              backgroundColor: c.color,
                            }}
                          />
                          <Text
                            style={{ fontWeight: '500', color: tokens.ink, fontSize: 14 }}
                            numberOfLines={1}
                          >
                            {c.name}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontWeight: '600',
                            color: tokens.ink,
                            fontVariant: ['tabular-nums'],
                            fontSize: 13,
                          }}
                        >
                          {formatCurrency(c.total, currency)}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: tokens.border,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${Math.round(pct * 100)}%`,
                            height: '100%',
                            backgroundColor: c.color,
                          }}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Top merchants */}
            <SectionHeader>Top merchants</SectionHeader>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                overflow: 'hidden',
              }}
            >
              {topMerchants.length === 0 ? (
                <Text
                  style={{
                    padding: 20,
                    color: tokens.muted,
                    textAlign: 'center',
                    fontSize: 13,
                  }}
                >
                  No data yet.
                </Text>
              ) : (
                topMerchants.map((m, i) => (
                  <View
                    key={m.merchant}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: tokens.border,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: tokens.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: tokens.ink, fontSize: 12 }}>
                        {i + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontWeight: '500', color: tokens.ink, fontSize: 14 }}
                        numberOfLines={1}
                      >
                        {m.merchant}
                      </Text>
                      <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}>
                        {m.count} {m.count === 1 ? 'visit' : 'visits'}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontWeight: '600',
                        color: tokens.ink,
                        fontVariant: ['tabular-nums'],
                        fontSize: 14,
                      }}
                    >
                      {formatCurrency(m.total, currency)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
