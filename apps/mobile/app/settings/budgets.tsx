// Budgets list — pixel-match mockup §7 screen 17 + 19 (edit sheet).
// Layout: header (back + title + plus-button) → card rows with avatar +
// name · period + status chip + spent/total + remaining/over + progress.
// Plus-button in header + bottom-right FAB both open the edit sheet.

import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Budget, BudgetScope, BudgetPeriod } from '@voxpense/shared-types';

import {
  Screen,
  Card,
  Button,
  Input,
  Sheet,
  LoadingView,
  EmptyView,
} from '../../src/components/glass';
import { SegmentedControl } from '../../src/components/settings';
import {
  useBudgetProgress,
  useBudgets,
  useCategories,
  useCreateBudget,
  useDeleteBudget,
  useGroups,
  useUpdateBudget,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';
import type { BudgetProgress } from '../../src/lib/insights';
import { shadows } from '../../src/theme/tokens';

interface DraftBudget {
  id?: string;
  name: string;
  amount: string;
  scope: BudgetScope;
  period: BudgetPeriod;
  alertAt: number;
  categoryId: string | null;
  groupId: string | null;
}

const EMPTY_DRAFT: DraftBudget = {
  name: '',
  amount: '',
  scope: 'overall',
  period: 'monthly',
  alertAt: 80,
  categoryId: null,
  groupId: null,
};

// Static array-form pressable style: row tap opacity only.
const ROW_PRESSABLE_STYLE = [{ marginBottom: 0 }];
// Static header-button pressable style.
const HEADER_BTN_STYLE_BASE = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export default function BudgetsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const budgets = useBudgets();
  const cats = useCategories();
  const groups = useGroups();
  const { rows: progress } = useBudgetProgress();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const [draft, setDraft] = useState<DraftBudget | null>(null);

  const progressById = useMemo(() => {
    const m = new Map<string, BudgetProgress>();
    for (const r of progress) m.set(r.budget.id, r);
    return m;
  }, [progress]);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const surf = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const divider = isDark ? '#1F2937' : '#E2E8F0';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  const openEdit = (b: Budget) => {
    setDraft({
      id: b.id,
      name: b.name,
      amount: b.amount,
      scope: b.scope,
      period: b.period,
      alertAt: b.alertAt,
      categoryId: b.categoryId,
      groupId: b.groupId,
    });
  };

  const submit = async () => {
    if (!draft) return;
    const amount = draft.amount.trim();
    if (!draft.name.trim() || !amount || Number.isNaN(Number(amount))) {
      Alert.alert('Missing fields', 'Add a name and a numeric amount.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name,
            amount,
            scope: draft.scope,
            period: draft.period,
            alertAt: draft.alertAt,
            categoryId: draft.scope === 'category' ? draft.categoryId : null,
            groupId: draft.scope === 'group' ? draft.groupId : null,
          },
        });
      } else {
        await create.mutateAsync({
          name: draft.name,
          amount,
          currency,
          scope: draft.scope,
          period: draft.period,
          alertAt: draft.alertAt,
          categoryId: draft.scope === 'category' && draft.categoryId
            ? draft.categoryId
            : undefined,
          groupId: draft.scope === 'group' && draft.groupId
            ? draft.groupId
            : undefined,
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete budget?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id);
            setDraft(null);
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again.');
          }
        },
      },
    ]);
  };

  const scopeLabel = (b: Budget): string => {
    if (b.scope === 'category') {
      return cats.data?.find((c) => c.id === b.categoryId)?.name ?? 'Category';
    }
    if (b.scope === 'group') {
      return groups.data?.find((g) => g.id === b.groupId)?.name ?? 'Group';
    }
    return 'Overall';
  };

  const iconForBudget = (b: Budget): keyof typeof Ionicons.glyphMap => {
    if (b.scope === 'overall') return 'flag-outline';
    if (b.scope === 'group') return 'folder-outline';
    return 'pricetag-outline';
  };

  const colorForBudget = (b: Budget): string => {
    if (b.scope === 'category') {
      return cats.data?.find((c) => c.id === b.categoryId)?.color ?? '#3B82F6';
    }
    if (b.scope === 'group') {
      return groups.data?.find((g) => g.id === b.groupId)?.color ?? '#3B82F6';
    }
    return '#64748B';
  };

  return (
    <Screen>
      {/* Mockup header — back + title + plus-button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={[HEADER_BTN_STYLE_BASE, { backgroundColor: surf }]}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={ink} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: ink }}>Budgets</Text>
        <Pressable
          onPress={() => setDraft({ ...EMPTY_DRAFT })}
          style={[HEADER_BTN_STYLE_BASE, { backgroundColor: brand }]}
          accessibilityLabel="Add budget"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {budgets.isLoading ? (
        <LoadingView />
      ) : (budgets.data ?? []).length === 0 ? (
        <EmptyView
          title="No budgets yet"
          body="Tap + to create one and we'll track your spend against it."
          action={{ label: 'Add budget', onPress: () => setDraft({ ...EMPTY_DRAFT }) }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 12 }}
        >
          {(budgets.data ?? []).map((b) => {
            const p = progressById.get(b.id);
            const pct = p ? Math.min(100, Math.round(p.pct * 100)) : 0;
            const overshoot = p && p.pct > 1;
            const statusColor =
              p?.status === 'bad' ? '#EF4444'
                : p?.status === 'warn' ? '#F59E0B'
                : '#10B981';
            const statusBg =
              p?.status === 'bad' ? 'rgba(239,68,68,0.15)'
                : p?.status === 'warn' ? 'rgba(245,158,11,0.15)'
                : 'rgba(16,185,129,0.15)';
            const iconColor = colorForBudget(b);
            const iconBg = `${iconColor}26`;

            return (
              <Pressable
                key={b.id}
                onPress={() => openEdit(b)}
                style={ROW_PRESSABLE_STYLE}
                accessibilityRole="button"
              >
                <View
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    ...shadows.card,
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
                          width: 32,
                          height: 32,
                          borderRadius: 12,
                          backgroundColor: iconBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={iconForBudget(b)} size={16} color={iconColor} />
                      </View>
                      <Text
                        style={{ fontSize: 14, fontWeight: '600', color: ink, flex: 1 }}
                        numberOfLines={1}
                      >
                        {b.name}
                        <Text style={{ color: meta, fontWeight: '400', fontSize: 11 }}>
                          {'  ·  '}
                          {b.period}
                          {b.scope !== 'overall' ? ` · ${scopeLabel(b)}` : ''}
                        </Text>
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: statusBg,
                      }}
                    >
                      <Text
                        style={{ fontSize: 11, fontWeight: '600', color: statusColor }}
                      >
                        {pct}%
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: ink }}>
                      {formatCurrency(p?.spent ?? 0, currency)}
                      <Text style={{ fontSize: 11, fontWeight: '400', color: meta }}>
                        {' / '}
                        {formatCurrency(b.amount, currency)}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
                      {overshoot
                        ? `${formatCurrency(Math.abs(p?.remaining ?? 0), currency)} over`
                        : `${formatCurrency(Math.max(0, p?.remaining ?? 0), currency)} left`}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: divider,
                      marginTop: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: statusColor,
                      }}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom-right FAB — spec-mandated pattern: outer absolute View covers
          whole screen w/ pointerEvents box-none, inner View anchors right:24,
          bottom:96, Pressable inside. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', right: 24, bottom: 96 }}
        >
          <Pressable
            onPress={() => setDraft({ ...EMPTY_DRAFT })}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: brand,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.94 : 1 }],
              ...shadows.fab,
            })}
            accessibilityLabel="Add budget"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit budget' : 'New budget'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. Travel"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
            />
            <Input
              label={`Amount (${currency})`}
              placeholder="3000"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
            />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 6 }}>
                Scope
              </Text>
              <SegmentedControl
                value={draft.scope}
                onChange={(scope) => setDraft({ ...draft, scope })}
                options={[
                  { label: 'Overall', value: 'overall' },
                  { label: 'Category', value: 'category' },
                  { label: 'Group', value: 'group' },
                ]}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 6 }}>
                Period
              </Text>
              <SegmentedControl
                value={draft.period}
                onChange={(period) => setDraft({ ...draft, period })}
                options={[
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {draft.id && (
                <Button variant="danger" onPress={() => confirmDelete(draft.id as string)}>
                  Delete
                </Button>
              )}
              <View style={{ flex: 1 }} />
              <Button variant="ghost" onPress={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onPress={submit} loading={create.isPending || update.isPending}>
                Save
              </Button>
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
