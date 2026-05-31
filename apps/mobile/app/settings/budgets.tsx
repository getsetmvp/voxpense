// Budgets list screen — progress bars per budget, FAB to add, Sheet to edit.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import type { Budget } from '@voxpense/shared-types';

import { Screen, Card, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import { FAB, ScreenHeader, SegmentedControl } from '../../src/components/settings';
import {
  useBudgetProgress,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';
import type { BudgetProgress } from '../../src/lib/insights';

interface DraftBudget {
  id?: string;
  name: string;
  amount: string;
  scope: 'overall' | 'category' | 'group';
  period: 'weekly' | 'monthly' | 'yearly';
  alertAt: number;
}

const EMPTY_DRAFT: DraftBudget = {
  name: '',
  amount: '',
  scope: 'overall',
  period: 'monthly',
  alertAt: 80,
};

export default function BudgetsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const budgets = useBudgets();
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

  const openEdit = (b: Budget) => {
    setDraft({
      id: b.id,
      name: b.name,
      amount: b.amount,
      scope: b.scope,
      period: b.period,
      alertAt: b.alertAt,
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

  return (
    <Screen>
      <ScreenHeader title="Budgets" />
      {budgets.isLoading ? (
        <LoadingView />
      ) : (budgets.data ?? []).length === 0 ? (
        <EmptyView
          title="No budgets yet"
          body="Tap + to create one and we'll track your spend against it."
          action={{ label: 'Add budget', onPress: () => setDraft({ ...EMPTY_DRAFT }) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
          {(budgets.data ?? []).map((b) => {
            const p = progressById.get(b.id);
            const pct = p ? Math.min(100, Math.round(p.pct * 100)) : 0;
            const overshoot = p && p.pct > 1;
            const statusColor =
              p?.status === 'bad' ? '#EF4444' : p?.status === 'warn' ? '#F59E0B' : '#10B981';
            const statusLabel =
              p?.status === 'bad' ? 'Over' : p?.status === 'warn' ? 'Nearing' : 'On track';
            return (
              <Pressable
                key={b.id}
                onPress={() => openEdit(b)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Card>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: ink }}>
                      {b.name}{' '}
                      <Text style={{ color: meta, fontWeight: '400', fontSize: 12 }}>
                        · {b.period}
                      </Text>
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: `${statusColor}22`,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
                        {pct}% · {statusLabel}
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
                      <Text style={{ fontSize: 12, fontWeight: '400', color: meta }}>
                        {' / '}
                        {formatCurrency(b.amount, currency)}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor }}>
                      {overshoot
                        ? `${formatCurrency(Math.abs(p?.remaining ?? 0), currency)} over`
                        : `${formatCurrency(Math.max(0, p?.remaining ?? 0), currency)} left`}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isDark ? '#1F2937' : '#E2E8F0',
                      marginTop: 12,
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
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <FAB onPress={() => setDraft({ ...EMPTY_DRAFT })} />

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
