// Recurring expense settings — list + inline new/edit sheet.

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import { Repeat, Plus } from 'lucide-react-native';
import type { Recurring } from '@voxpense/shared-types';

import { Screen, Header } from '../../src/components/layout';
import {
  Button,
  Input,
  ListItem,
  Sheet,
  EmptyState,
  ConfirmDialog,
  Skeleton,
  useToast,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useRecurring,
  useCategories,
  useWallets,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatMoney } from '../../src/lib/money';

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const FREQ_LABEL: Record<Freq, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

function rruleFor(freq: Freq): string {
  return `FREQ=${freq}`;
}

function freqFromRrule(rrule: string): Freq {
  const m = rrule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
  return (m?.[1] as Freq) ?? 'MONTHLY';
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface Draft {
  id?: string;
  name: string;
  amount: string;
  categoryId?: string;
  walletId: string;
  freq: Freq;
  active: boolean;
  nextRunAt: string;
}

export default function RecurringSettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');

  const q = useRecurring();
  const catsQ = useCategories();
  const walletsQ = useWallets();
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const remove = useDeleteRecurring();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const items = q.data ?? [];
  const cats = catsQ.data ?? [];
  const wallets = walletsQ.data ?? [];

  const openNew = () => {
    const today = new Date().toISOString();
    setDraft({
      name: '',
      amount: '0',
      walletId: wallets[0]?.id ?? '',
      freq: 'MONTHLY',
      active: true,
      nextRunAt: today,
    });
  };

  const openEdit = (r: Recurring) =>
    setDraft({
      id: r.id,
      name: r.name,
      amount: r.amount,
      categoryId: r.categoryId ?? undefined,
      walletId: r.walletId,
      freq: freqFromRrule(r.rrule),
      active: r.active,
      nextRunAt: r.nextRunAt,
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
    if (!draft.walletId) {
      toast.show('Pick a wallet', 'bad');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name.trim(),
            amount: draft.amount,
            categoryId: draft.categoryId ?? null,
            walletId: draft.walletId,
            rrule: rruleFor(draft.freq),
            active: draft.active,
          },
        });
        toast.show('Recurring saved', 'good');
      } else {
        await create.mutateAsync({
          name: draft.name.trim(),
          amount: draft.amount,
          currency: baseCurrency,
          categoryId: draft.categoryId,
          walletId: draft.walletId,
          rrule: rruleFor(draft.freq),
          nextRunAt: draft.nextRunAt,
          active: draft.active,
        });
        toast.show('Recurring created', 'good');
      }
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  const toggleActive = async (r: Recurring) => {
    try {
      await update.mutateAsync({ id: r.id, body: { active: !r.active } });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Update failed', 'bad');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete);
      toast.show('Recurring deleted', 'good');
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
        title="Recurring"
        right={
          <Pressable onPress={openNew} hitSlop={8}>
            <Plus size={20} color={tokens.brand} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}>
        {q.isLoading ? (
          <View style={{ gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 64, borderRadius: 16 }} />
            ))}
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Repeat size={28} color={tokens.brand} />}
            title="Nothing recurring yet"
            body="Rent, subscriptions, bills — set them once and they post automatically."
            action={
              <Button label="Add recurring" variant="brand" fullWidth={false} onPress={openNew} />
            }
          />
        ) : (
          <View
            style={{
              backgroundColor: tokens.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: tokens.border,
              overflow: 'hidden',
            }}
          >
            {items.map((r, i) => (
              <View key={r.id} style={{ opacity: r.active ? 1 : 0.6 }}>
                <ListItem
                  leading={
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: `${tokens.brand}1A`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Repeat size={18} color={tokens.brand} />
                    </View>
                  }
                  title={r.name}
                  subtitle={`Next: ${fmtDate(r.nextRunAt)} · ${FREQ_LABEL[freqFromRrule(r.rrule)]}`}
                  trailing={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: tokens.ink,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {formatMoney(Number(r.amount), r.currency)}
                      </Text>
                      <Switch
                        value={r.active}
                        onValueChange={() => toggleActive(r)}
                        trackColor={{ true: tokens.brand, false: tokens.border }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  }
                  onPress={() => openEdit(r)}
                />
                {i < items.length - 1 ? (
                  <View
                    style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={90}>
        {draft && (
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
              {draft.id ? 'Edit recurring' : 'New recurring'}
            </Text>

            <Input
              label="Name"
              placeholder="e.g. Rent"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              autoCapitalize="sentences"
            />

            <Input
              label={`Amount (${baseCurrency})`}
              placeholder="0"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
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
                Frequency
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as Freq[]).map((f) => {
                  const selected = draft.freq === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setDraft({ ...draft, freq: f })}
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
                          fontSize: 12,
                          fontWeight: '600',
                          color: selected ? tokens.brand : tokens.ink,
                        }}
                      >
                        {FREQ_LABEL[f]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
                Wallet
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {wallets.map((w) => {
                  const selected = draft.walletId === w.id;
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => setDraft({ ...draft, walletId: w.id })}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: selected ? tokens.brand : tokens.ink,
                        }}
                      >
                        {w.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
                <Pressable
                  onPress={() => setDraft({ ...draft, categoryId: undefined })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: !draft.categoryId ? tokens.brand : tokens.border,
                    backgroundColor: !draft.categoryId ? `${tokens.brand}14` : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: !draft.categoryId ? tokens.brand : tokens.ink,
                    }}
                  >
                    None
                  </Text>
                </Pressable>
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

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.ink }}>
                  Active
                </Text>
                <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}>
                  Auto-posts on schedule
                </Text>
              </View>
              <Switch
                value={draft.active}
                onValueChange={(active) => setDraft({ ...draft, active })}
                trackColor={{ true: tokens.brand, false: tokens.border }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={{ fontSize: 11, color: tokens.muted }}>
              {draft.id ? 'Next run' : 'First run'}: {fmtDate(draft.nextRunAt)}
            </Text>

            <View style={{ height: 4 }} />
            <Button
              label={draft.id ? 'Save changes' : 'Create recurring'}
              onPress={submit}
              loading={create.isPending || update.isPending}
            />
            {draft.id ? (
              <Button
                label="Delete recurring"
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
        title="Delete recurring?"
        message="Already-posted expenses stay. Future runs are cancelled."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </Screen>
  );
}
