// Insights tab — top metrics, daily bar chart, category donut, top merchants, AI Ask.
// Server state via React Query (useInsightsWindow) + client-side aggregation.

import { useMemo } from 'react';
import { ScrollView, View, Text, useColorScheme, RefreshControl } from 'react-native';

import { Screen, Card, LoadingView, EmptyView, ErrorView } from '../../src/components/glass';
import {
  AskInput,
  BarChart,
  DonutChart,
  MetricTile,
} from '../../src/components/insights';
import { useAuth } from '../../src/store/auth';
import {
  useDailySpend,
  useExpensesByCategory,
  useInsightsWindow,
  usePeriodTotals,
  useTopMerchants,
} from '../../src/queries/insights';
import { formatCompact, formatCurrency } from '../../src/lib/format';

export default function InsightsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const window = useInsightsWindow(45);
  const totals = usePeriodTotals(window.expenses);
  const byCategory = useExpensesByCategory(window.expenses);
  const dailySpend = useDailySpend(window.expenses, 14);
  const topMerchants = useTopMerchants(window.expenses, 5);

  const topCats = useMemo(() => byCategory.slice(0, 5), [byCategory]);

  if (window.isLoading) {
    return (
      <Screen>
        <LoadingView label="Crunching numbers..." />
      </Screen>
    );
  }
  // Only treat as error when we genuinely failed AND have no data to show.
  // A brand-new user with zero expenses returns 200 with an empty list — that's
  // an empty state, not an error.
  if (window.isError && window.expenses.length === 0) {
    return (
      <Screen>
        <ErrorView
          title="Couldn't load insights"
          message="Pull to retry or check connection."
          onRetry={() => window.refetch()}
        />
      </Screen>
    );
  }
  if (window.expenses.length === 0) {
    return (
      <Screen>
        <EmptyView
          title="No expenses yet"
          body="Log your first expense to see your spending insights, categories and trends."
        />
      </Screen>
    );
  }

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={window.isLoading}
            onRefresh={() => window.refetch()}
            tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
        }
      >
        <Text style={{ fontSize: 26, fontWeight: '700', color: ink }}>Insights</Text>

        {/* Metric tiles */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <MetricTile
              label="This week"
              value={formatCompact(totals.thisWeek, currency)}
              delta={totals.lastWeek > 0 ? { value: totals.weekDelta } : null}
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricTile
              label="This month"
              value={formatCompact(totals.thisMonth, currency)}
              delta={totals.lastMonth > 0 ? { value: totals.monthDelta } : null}
            />
          </View>
        </View>

        {/* Daily bar chart */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '600', color: meta, marginBottom: 4 }}>
            DAILY SPEND · LAST 14 DAYS
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: ink, marginBottom: 12 }}>
            {formatCurrency(dailySpend.reduce((a, b) => a + b.total, 0), currency)}
          </Text>
          <BarChart
            data={dailySpend.map((b, i) => ({
              label: b.date.getDate().toString(),
              value: b.total,
              highlight: i === dailySpend.length - 1,
            }))}
            height={100}
          />
        </Card>

        {/* Category donut */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '600', color: meta, marginBottom: 12 }}>
            SPEND BY CATEGORY
          </Text>
          {topCats.length === 0 ? (
            <Text style={{ fontSize: 14, color: meta }}>No expenses yet in this window.</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <DonutChart
                data={topCats.map((c) => ({ value: c.total, color: c.color }))}
                size={108}
                trackColor={isDark ? '#1F2937' : '#F1F4F8'}
              />
              <View style={{ flex: 1, gap: 8 }}>
                {topCats.map((c) => (
                  <View
                    key={c.categoryId ?? 'uncategorized'}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: c.color,
                        }}
                      />
                      <Text
                        style={{ fontSize: 13, color: ink, flex: 1 }}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: ink }}>
                      {Math.round(c.share * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Top merchants */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '600', color: meta, marginBottom: 12 }}>
            TOP MERCHANTS · LAST 45 DAYS
          </Text>
          {topMerchants.length === 0 ? (
            <Text style={{ fontSize: 14, color: meta }}>Nothing here yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {topMerchants.map((m) => (
                <View
                  key={m.merchant}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: '500', color: ink }}
                      numberOfLines={1}
                    >
                      {m.merchant}
                    </Text>
                    <Text style={{ fontSize: 11, color: meta, marginTop: 2 }}>
                      {m.count} {m.count === 1 ? 'expense' : 'expenses'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: ink }}>
                    {formatCurrency(m.total, currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* AI Ask */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '600', color: meta, marginBottom: 12 }}>
            ASK
          </Text>
          <AskInput from={window.from} to={window.to} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
