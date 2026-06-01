// Home tab (mockup 07). MVP visual design, new-app data layer.
// Greeting + monthly hero + top groups + budgets carousel + recent list + FAB.

import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Bell, ListPlus, Plus, TrendingUp, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { FabStack } from '../../src/components/layout/FabStack';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Amount } from '../../src/components/ui/Amount';
import { Chip } from '../../src/components/ui/Chip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ExpenseRow } from '../../src/components/feature/ExpenseRow';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import {
  useGroups,
  useInsightsWindow,
  usePeriodTotals,
  useExpensesByCategory,
  useBudgetProgress,
} from '../../src/queries/insights';
import { useExpensesList, flattenPages } from '../../src/queries/expenses';
import { formatMoney } from '../../src/lib/money';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeTab() {
  const { tokens } = useTheme();
  const router = useRouter();
  const firstName = useAuth((s) => s.user?.name?.split(' ')[0]) ?? 'there';
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');
  const userInitial = useAuth(
    (s) => (s.user?.name ?? 'Y').charAt(0).toUpperCase(),
  );

  // Monthly window
  const insights = useInsightsWindow(30);
  const totals = usePeriodTotals(insights.expenses);
  const monthTotal = totals.thisMonth;

  // Top categories (group-level mapping not directly available — use categories as proxy
  // since CategoryBreakdown carries a name + color and matches "top 3" surface area).
  const catBreakdown = useExpensesByCategory(insights.expenses);
  const topCats = catBreakdown.slice(0, 3);

  // Budgets
  const budgets = useBudgetProgress();

  // Groups (for ExpenseRow decoration)
  const groupsQ = useGroups();
  const groups = groupsQ.data ?? [];

  // Recent expenses
  const recent = useExpensesList({ limit: 10 });
  const expenses = flattenPages(recent.data);

  const refreshing = insights.isLoading || recent.isRefetching;
  const onRefresh = () => {
    insights.refetch();
    recent.refetch();
  };

  return (
    <Screen edges={['top']}>
      {/* Top bar */}
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
        <View>
          <Text style={{ fontSize: 12, color: tokens.muted }}>{greeting()}</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: tokens.ink }}>
            {firstName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push('/settings/reminders')}
            style={BELL_BTN(tokens.border, tokens.surface)}
          >
            <Bell size={18} color={tokens.ink} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings/profile')}
            style={AVATAR_BTN(tokens.brand)}
          >
            <Text style={{ color: tokens.brand, fontWeight: '700' }}>
              {userInitial}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.brand}
            colors={[tokens.brand]}
          />
        }
      >
        {/* Hero card */}
        <View
          style={{
            borderRadius: 24,
            backgroundColor: tokens.ink,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: 'rgba(250,250,250,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Spent this month
          </Text>
          <View style={{ marginTop: 4 }}>
            <Amount
              value={monthTotal}
              currency={baseCurrency}
              size={30}
              weight="700"
              color={tokens.inkInverse}
              mutedColor="rgba(250,250,250,0.6)"
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            <TrendingUp size={14} color={tokens.warn} />
            <Text style={{ fontSize: 12, color: 'rgba(250,250,250,0.7)' }}>
              vs last month
            </Text>
          </View>
          {topCats.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              {topCats.map((g) => (
                <View key={g.categoryId ?? 'ungrouped'} style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 11, color: 'rgba(250,250,250,0.6)' }}
                  >
                    {g.name}
                  </Text>
                  <Text
                    style={{
                      color: tokens.inkInverse,
                      fontWeight: '600',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatMoney(g.total, baseCurrency, {
                      compact: g.total >= 10000,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Budgets carousel */}
        {budgets.rows.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            style={{
              marginHorizontal: -20,
              paddingHorizontal: 20,
              marginBottom: 16,
            }}
          >
            {budgets.rows.map((b) => {
              const stateColor =
                b.status === 'bad'
                  ? tokens.bad
                  : b.status === 'warn'
                    ? tokens.warn
                    : tokens.good;
              return (
                <View
                  key={b.budget.id}
                  style={{
                    width: 180,
                    borderRadius: 16,
                    backgroundColor: tokens.surface,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Chip label={b.budget.name} variant="brand" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: stateColor,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {Math.round(b.pct * 100)}%
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
                        width: `${Math.min(100, b.pct * 100)}%`,
                        height: '100%',
                        backgroundColor: stateColor,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: tokens.muted,
                      marginTop: 8,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatMoney(b.spent, b.budget.currency)} /{' '}
                    {formatMoney(
                      Number(b.budget.amount),
                      b.budget.currency,
                    )}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Recent */}
        <SectionHeader
          right={
            <Pressable onPress={() => router.push('/(tabs)/expenses')}>
              <Text
                style={{ fontSize: 12, color: tokens.brand, fontWeight: '600' }}
              >
                See all
              </Text>
            </Pressable>
          }
        >
          Recent
        </SectionHeader>

        {expenses.length === 0 ? (
          <EmptyState
            icon={<User color={tokens.brand} size={28} />}
            title="No expenses yet"
            body="Tap the mic to log your first expense by voice, or use the camera for a receipt."
            action={
              <Pressable
                onPress={() => router.push('/(capture)/manual')}
                style={{
                  marginTop: 8,
                  paddingHorizontal: 16,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: tokens.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <ListPlus color="#FFFFFF" size={16} />
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Add manually
                </Text>
              </Pressable>
            }
          />
        ) : (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: tokens.surface,
              borderWidth: 1,
              borderColor: tokens.border,
              overflow: 'hidden',
            }}
          >
            {expenses.map((e, i) => (
              <View key={e.id}>
                <ExpenseRow
                  expense={e}
                  group={groups.find((g) => g.id === e.groupId) ?? null}
                />
                {i < expenses.length - 1 ? (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: tokens.border,
                      marginLeft: 14,
                    }}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => router.push('/(capture)/manual')}
          style={{
            marginTop: 12,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: tokens.border,
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Plus size={16} color={tokens.ink} />
          <Text style={{ color: tokens.ink, fontWeight: '600' }}>
            New expense
          </Text>
        </Pressable>
      </ScrollView>
      <FabStack />
    </Screen>
  );
}

// Static layout-bearing Pressable styles (no { pressed } function form).
const BELL_BTN = (border: string, surface: string) =>
  ({
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface,
  }) as const;

const AVATAR_BTN = (brand: string) =>
  ({
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: `${brand}26`,
    alignItems: 'center',
    justifyContent: 'center',
  }) as const;
