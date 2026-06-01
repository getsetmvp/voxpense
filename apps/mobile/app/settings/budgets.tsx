// Budgets settings — card list with progress bar + inline new/edit sheet.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Target, Plus } from 'lucide-react-native';
import type { Budget } from '@voxpense/shared-types';

import { Screen, Header } from '../../src/components/layout';
import {
  Button,
  Input,
  Card,
  Chip,
  Sheet,
  EmptyState,
  ConfirmDialog,
  Skeleton,
  useToast,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useBudgets,
  useBudgetProgress,
  useGroups,
  useCategories,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatMoney } from '../../src/lib/money';

type Scope = 'group' | 'category' | 'overall';
type Period = 'weekly' | 'monthly' | 'yearly';

interface Draft {
  id?: string;
  name: string;
  scope: Scope;
  groupId?: string;
  categoryId?: string;
  period: Period;
  amount: string;
  alertAt: number;
}

export default function BudgetsSettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');

  const q = useBudgets();
  const progress = useBudgetProgress();
  const groupsQ = useGroups();
  const catsQ = useCategories();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const budgets = q.data ?? [];
  const groups = groupsQ.data ?? [];
  const cats = catsQ.data ?? [];

  const progressById = useMemo(() => {
    const m = new Map<string, (typeof progress.rows)[number]>();
    for (const r of progress.rows) m.set(r.budget.id, r);
    return m;
  }, [progress.rows]);

  const groupName = (id?: string) => groups.find((g) => g.id === id)?.name ?? 'Group';
  const catName = (id?: string) => cats.find((c) => c.id === id)?.name ?? 'Category';

  const scopeLabel = (b: Budget) => {
    if (b.scope === 'group') return groupName(b.groupId ?? undefined);
    if (b.scope === 'category') return catName(b.categoryId ?? undefined);
    return 'Overall';
  };

  const openNew = () =>
    setDraft({
      name: '',
      scope: 'overall',
      period: 'monthly',
      amount: '10000',
      alertAt: 80,
    });

  const openEdit = (b: Budget) =>
    setDraft({
      id: b.id,
      name: b.name,
      scope: b.scope,
      groupId: b.groupId ?? undefined,
      categoryId: b.categoryId ?? undefined,
      period: b.period,
      amount: b.amount,
      alertAt: b.alertAt ?? 80,
    });

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.show('Name required', 'bad');
      return;
    }
    const amt = Number(draft.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.show('Amount must be positive', 'bad');
      return;
    }
    if (draft.scope === 'group' && !draft.groupId) {
      toast.show('Pick a group', 'bad');
      return;
    }
    if (draft.scope === 'category' && !draft.categoryId) {
      toast.show('Pick a category', 'bad');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name.trim(),
            scope: draft.scope,
            groupId: draft.scope === 'group' ? draft.groupId : null,
            categoryId: draft.scope === 'category' ? draft.categoryId : null,
            period: draft.period,
            amount: draft.amount,
            alertAt: draft.alertAt,
          },
        });
        toast.show('Budget saved', 'good');
      } else {
        await create.mutateAsync({
          name: draft.name.trim(),
          scope: draft.scope,
          groupId: draft.scope === 'group' ? draft.groupId : undefined,
          categoryId: draft.scope === 'category' ? draft.categoryId : undefined,
          period: draft.period,
          amount: draft.amount,
          currency: baseCurrency,
          alertAt: draft.alertAt,
        });
        toast.show('Budget created', 'good');
      }
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete);
      toast.show('Budget deleted', 'good');
      setConfirmDelete(null);
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Delete failed', 'bad');
      setConfirmDelete(null);
    }
  };

  return (
    <Screen>
      <Header
        back
        title="Budgets"
        right={
          <Pressable onPress={openNew} hitSlop={8}>
            <Plus size={20} color={tokens.brand} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
        {q.isLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 110, borderRadius: 16 }} />
            ))}
          </View>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={<Target size={28} color={tokens.brand} />}
            title="No budgets yet"
            body="Set spend caps per group, category, or overall — get alerts as you approach."
            action={
              <Button label="Add budget" variant="brand" fullWidth={false} onPress={openNew} />
            }
          />
        ) : (
          budgets.map((b) => {
            const row = progressById.get(b.id);
            const pct = row ? Math.min(100, Math.round(row.pct * 100)) : 0;
            const status = row?.status ?? 'ok';
            const barColor =
              status === 'bad' ? tokens.bad : status === 'warn' ? tokens.warn : tokens.good;
            const chipVariant =
              status === 'bad' ? 'bad' : status === 'warn' ? 'warn' : 'good';
            return (
              <Pressable key={b.id} onPress={() => openEdit(b)}>
                <Card>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: '700', color: tokens.ink }}
                        numberOfLines={1}
                      >
                        {b.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}>
                        {scopeLabel(b)} · {b.period}
                      </Text>
                    </View>
                    <Chip
                      label={
                        status === 'bad'
                          ? `Over ${pct}%`
                          : status === 'warn'
                            ? `${pct}%`
                            : 'On track'
                      }
                      variant={chipVariant}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
                      {formatMoney(row?.spent ?? 0, b.currency)}
                    </Text>
                    <Text
                      style={{
                        color: tokens.muted,
                        fontSize: 12,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      of {formatMoney(Number(b.amount), b.currency)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: tokens.border,
                      overflow: 'hidden',
                      marginTop: 10,
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: barColor,
                      }}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={90}>
        {draft && (
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
              {draft.id ? 'Edit budget' : 'New budget'}
            </Text>

            <Input
              label="Name"
              placeholder="e.g. Monthly food"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              autoCapitalize="sentences"
            />

            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: tokens.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Scope
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['overall', 'group', 'category'] as Scope[]).map((s) => {
                  const selected = draft.scope === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setDraft({ ...draft, scope: s })}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : tokens.surface,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: selected ? tokens.brand : tokens.ink,
                          textTransform: 'capitalize',
                        }}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {draft.scope === 'group' ? (
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: tokens.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Group
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {groups.map((g) => {
                    const selected = draft.groupId === g.id;
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setDraft({ ...draft, groupId: g.id })}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? tokens.brand : tokens.border,
                          backgroundColor: selected ? `${tokens.brand}14` : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: g.color,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: selected ? tokens.brand : tokens.ink,
                          }}
                        >
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {draft.scope === 'category' ? (
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: tokens.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Category
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cats.map((c) => {
                    const selected = draft.categoryId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setDraft({ ...draft, categoryId: c.id })}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? tokens.brand : tokens.border,
                          backgroundColor: selected ? `${tokens.brand}14` : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
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
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: selected ? tokens.brand : tokens.ink,
                          }}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: tokens.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Period
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['weekly', 'monthly', 'yearly'] as Period[]).map((p) => {
                  const selected = draft.period === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setDraft({ ...draft, period: p })}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : tokens.surface,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: selected ? tokens.brand : tokens.ink,
                          textTransform: 'capitalize',
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input
              label={`Amount (${baseCurrency})`}
              placeholder="10000"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
            />

            <Input
              label="Alert at (% of budget)"
              placeholder="80"
              keyboardType="number-pad"
              value={String(draft.alertAt)}
              onChangeText={(t) => {
                const n = Number(t);
                setDraft({ ...draft, alertAt: Number.isFinite(n) ? n : 80 });
              }}
            />

            <View style={{ height: 4 }} />
            <Button
              label={draft.id ? 'Save changes' : 'Create budget'}
              onPress={submit}
              loading={create.isPending || update.isPending}
            />
            {draft.id ? (
              <Button
                label="Delete budget"
                variant="danger"
                onPress={() => setConfirmDelete(draft.id!)}
              />
            ) : null}
            <Button label="Cancel" variant="ghost" onPress={() => setDraft(null)} />
          </ScrollView>
        )}
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="Delete budget?"
        message="Spending history stays — only the cap is removed."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </Screen>
  );
}
