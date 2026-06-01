// Insights tab — pixel-aligned to mockup section 7, screen 16 (with spec
// add-ons: 2 metric tiles + daily-spend chart per Agent L hard requirements).
//
// Layout (top → bottom):
//   1. "Insights" page title
//   2. Hero glass card — "This month" spend w/ overall-budget progress
//   3. 2 metric tiles — This week, This month (delta-aware)
//   4. Daily spend bar chart (14 days)
//   5. Mini budgets list (top 2 non-overall, link to /settings/budgets)
//   6. Spend by category donut + legend
//   7. Top merchants list (45-day window)
//   8. AI Ask card

import { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, LoadingView, EmptyView, ErrorView } from '../../src/components/glass';
import {
  AskInput,
  BarChart,
  DonutChart,
  MetricTile,
} from '../../src/components/insights';
import { useAuth } from '../../src/store/auth';
import {
  useBudgetProgress,
  useDailySpend,
  useExpensesByCategory,
  useInsightsWindow,
  usePeriodTotals,
  useTopMerchants,
} from '../../src/queries/insights';
import { formatCompact, formatCurrency } from '../../src/lib/format';
import type { BudgetProgress } from '../../src/lib/insights';

// "section header" style — uppercased + tracked, mirrors mockup `.section-h`.
const SECTION_HEADER_LIGHT = {
  fontSize: 11,
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.6,
  color: '#64748B',
};
const SECTION_HEADER_DARK = { ...SECTION_HEADER_LIGHT, color: '#94A3B8' };

function statusColors(p: BudgetProgress | undefined): {
  color: string;
  label: string;
  bgRgba: string;
} {
  if (!p) return { color: '#64748B', label: '0%', bgRgba: 'rgba(100,116,139,0.18)' };
  const pct = Math.round(p.pct * 100);
  if (p.status === 'bad') {
    return { color: '#EF4444', label: `${pct}%`, bgRgba: 'rgba(239,68,68,0.15)' };
  }
  if (p.status === 'warn') {
    return { color: '#F59E0B', label: `${pct}%`, bgRgba: 'rgba(245,158,11,0.15)' };
  }
  return { color: '#10B981', label: `${pct}%`, bgRgba: 'rgba(16,185,129,0.15)' };
}

const PRESSABLE_OPACITY_STYLE = ({ pressed }: { pressed: boolean }) => ({
  opacity: pressed ? 0.7 : 1,
});

export default function InsightsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const window = useInsightsWindow(45);
  const totals = usePeriodTotals(window.expenses);
  const byCategory = useExpensesByCategory(window.expenses);
  const dailySpend = useDailySpend(window.expenses, 14);
  const topMerchants = useTopMerchants(window.expenses, 5);
  const { rows: budgetRows } = useBudgetProgress();

  const overall = useMemo(
    () => budgetRows.find((r) => r.budget.scope === 'overall'),
    [budgetRows],
  );
  const miniBudgets = useMemo(
    () => budgetRows.filter((r) => r.budget.scope !== 'overall').slice(0, 2),
    [budgetRows],
  );
  const topCats = useMemo(() => byCategory.slice(0, 5), [byCategory]);

  if (window.isLoading) {
    return (
      <Screen>
        <LoadingView label="Crunching numbers..." />
      </Screen>
    );
  }
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
  const sectionH = isDark ? SECTION_HEADER_DARK : SECTION_HEADER_LIGHT;
  const surf = isDark ? '#0F172A' : '#FFFFFF';
  const surfBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const divider = isDark ? '#1F2937' : '#F1F4F8';

  const overallChip = statusColors(overall);
  const heroSpent = overall ? overall.spent : totals.thisMonth;
  const heroTotal = overall ? Number(overall.budget.amount) : 0;
  const heroPct = overall ? Math.min(1, overall.pct) : 0;
  const dailyTotal = dailySpend.reduce((acc, b) => acc + b.total, 0);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={window.isLoading}
            onRefresh={() => window.refetch()}
            tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
        }
      >
        {/* Page title */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: ink, paddingTop: 4 }}>
          Insights
        </Text>

        {/* Hero "this month" glass card with overall-budget progress */}
        <Card intensity="md">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <Text style={sectionH}>This month</Text>
            {overall && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: overallChip.bgRgba,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: overallChip.color }}>
                  {overallChip.label}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 32, fontWeight: '700', color: ink, marginTop: 4 }}>
            {formatCurrency(heroSpent, currency)}
          </Text>
          <Text style={{ fontSize: 11, color: meta, marginTop: 2 }}>
            {overall
              ? `of ${formatCurrency(heroTotal, currency)} budget`
              : 'No overall budget set'}
          </Text>
          {overall && (
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: divider,
                marginTop: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(heroPct * 100)}%`,
                  backgroundColor: overallChip.color,
                }}
              />
            </View>
          )}
        </Card>

        {/* Two metric tiles — week + month */}
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

        {/* Daily spend bar chart */}
        <View>
          <Text style={[sectionH, { marginBottom: 8 }]}>Daily spend · last 14 days</Text>
          <View
            style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: surf,
              borderWidth: 1,
              borderColor: surfBorder,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: ink,
                marginBottom: 12,
              }}
            >
              {formatCurrency(dailyTotal, currency)}
            </Text>
            <BarChart
              data={dailySpend.map((b, i) => ({
                label: b.date.getDate().toString(),
                value: b.total,
                highlight: i === dailySpend.length - 1,
              }))}
              height={96}
            />
          </View>
        </View>

        {/* Mini budgets (top 2, non-overall) */}
        {miniBudgets.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={sectionH}>Budgets</Text>
              <Pressable
                onPress={() => router.push('/settings/budgets')}
                style={PRESSABLE_OPACITY_STYLE}
                accessibilityRole="link"
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6' }}>
                  See all →
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {miniBudgets.map((b) => {
                const chip = statusColors(b);
                const pct = Math.round(Math.min(100, b.pct * 100));
                return (
                  <View
                    key={b.budget.id}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: surf,
                      borderWidth: 1,
                      borderColor: surfBorder,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{ fontSize: 13, fontWeight: '600', color: ink, flex: 1 }}
                        numberOfLines={1}
                      >
                        {b.budget.name}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: chip.bgRgba,
                          marginLeft: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: chip.color }}>
                          {pct}%
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: ink, marginTop: 4 }}>
                      {formatCurrency(b.spent, currency)}
                      <Text style={{ fontSize: 10, color: meta, fontWeight: '400' }}>
                        {' / '}
                        {formatCurrency(b.budget.amount, currency)}
                      </Text>
                    </Text>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: divider,
                        marginTop: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: chip.color,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Spend by category — donut + legend */}
        <View>
          <Text style={[sectionH, { marginBottom: 8 }]}>Spend by category</Text>
          <View
            style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: surf,
              borderWidth: 1,
              borderColor: surfBorder,
            }}
          >
            {topCats.length === 0 ? (
              <Text style={{ fontSize: 13, color: meta }}>
                No categorized spend in this window.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <DonutChart
                  data={topCats.map((c) => ({ value: c.total, color: c.color }))}
                  size={96}
                  stroke={14}
                  trackColor={isDark ? '#1F2937' : '#F1F4F8'}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  {topCats.map((c) => (
                    <View
                      key={c.categoryId ?? 'uncategorized'}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
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
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: c.color,
                          }}
                        />
                        <Text
                          style={{ fontSize: 12, color: ink, flex: 1 }}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: ink }}>
                        {Math.round(c.share * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Top merchants */}
        <View>
          <Text style={[sectionH, { marginBottom: 8 }]}>
            Top merchants · last 45 days
          </Text>
          <View
            style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: surf,
              borderWidth: 1,
              borderColor: surfBorder,
              gap: 10,
            }}
          >
            {topMerchants.length === 0 ? (
              <Text style={{ fontSize: 13, color: meta }}>Nothing here yet.</Text>
            ) : (
              topMerchants.map((m) => (
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
              ))
            )}
          </View>
        </View>

        {/* AI Ask */}
        <View>
          <Text style={[sectionH, { marginBottom: 8 }]}>Ask</Text>
          <Card intensity="sm">
            <AskInput from={window.from} to={window.to} />
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
