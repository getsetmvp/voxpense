// Recurring entries list — next run + amount + frequency. Sheet to edit/delete.

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recurring } from '@voxpense/shared-types';

import { Screen, Card, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import { FAB, ScreenHeader, SegmentedControl, Toggle } from '../../src/components/settings';
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurring,
  useUpdateRecurring,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency, formatDate } from '../../src/lib/format';

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly';

function freqToRrule(freq: Freq): string {
  const map: Record<Freq, string> = {
    daily: 'FREQ=DAILY',
    weekly: 'FREQ=WEEKLY',
    monthly: 'FREQ=MONTHLY',
    yearly: 'FREQ=YEARLY',
  };
  return map[freq];
}

function rruleToFreq(rrule: string): Freq {
  if (rrule.includes('DAILY')) return 'daily';
  if (rrule.includes('WEEKLY')) return 'weekly';
  if (rrule.includes('YEARLY')) return 'yearly';
  return 'monthly';
}

function freqLabel(rrule: string): string {
  return rruleToFreq(rrule);
}

interface DraftRecurring {
  id?: string;
  name: string;
  amount: string;
  freq: Freq;
  nextRunAt: string;
  walletId: string;
  active: boolean;
}

export default function RecurringScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const recurring = useRecurring();
  const wallets = useWallets();
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const remove = useDeleteRecurring();

  const [draft, setDraft] = useState<DraftRecurring | null>(null);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const defaultDraft = (): DraftRecurring => {
    const firstWalletId = wallets.data?.[0]?.id ?? '';
    return {
      name: '',
      amount: '',
      freq: 'monthly',
      nextRunAt: new Date().toISOString(),
      walletId: firstWalletId,
      active: true,
    };
  };

  const openEdit = (r: Recurring) => {
    setDraft({
      id: r.id,
      name: r.name,
      amount: r.amount,
      freq: rruleToFreq(r.rrule),
      nextRunAt: r.nextRunAt,
      walletId: r.walletId,
      active: r.active,
    });
  };

  const submit = async () => {
    if (!draft) return;
    const amount = draft.amount.trim();
    if (!draft.name.trim() || !amount || Number.isNaN(Number(amount))) {
      Alert.alert('Missing fields', 'Add a name and a numeric amount.');
      return;
    }
    if (!draft.walletId) {
      Alert.alert('No wallet', 'Add a wallet first from Settings → Wallets.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name,
            amount,
            rrule: freqToRrule(draft.freq),
            nextRunAt: draft.nextRunAt,
            walletId: draft.walletId,
            active: draft.active,
          },
        });
      } else {
        await create.mutateAsync({
          name: draft.name,
          amount,
          currency,
          rrule: freqToRrule(draft.freq),
          nextRunAt: draft.nextRunAt,
          walletId: draft.walletId,
          active: draft.active,
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete recurring entry?', 'This cannot be undone.', [
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
      <ScreenHeader title="Recurring" />
      {recurring.isLoading ? (
        <LoadingView />
      ) : (recurring.data ?? []).length === 0 ? (
        <EmptyView
          title="No recurring entries"
          body="Add subscriptions, rent, and other repeating expenses."
          action={{ label: 'Add recurring', onPress: () => setDraft(defaultDraft()) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 10 }}>
          {(recurring.data ?? []).map((r) => (
            <Pressable
              key={r.id}
              onPress={() => openEdit(r)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={r.active ? 'repeat' : 'pause-outline'}
                      size={20}
                      color={isDark ? '#60A5FA' : '#3B82F6'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 15, fontWeight: '600', color: ink }}
                      numberOfLines={1}
                    >
                      {r.name}
                      {!r.active && (
                        <Text style={{ color: meta, fontWeight: '500', fontSize: 11 }}>
                          {' '}
                          · paused
                        </Text>
                      )}
                    </Text>
                    <Text style={{ fontSize: 11, color: meta, marginTop: 2 }}>
                      {freqLabel(r.rrule)} · Next: {formatDate(r.nextRunAt, 'd MMM')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: ink }}>
                    {formatCurrency(r.amount, currency)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <FAB onPress={() => setDraft(defaultDraft())} />

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit recurring' : 'New recurring'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. Rent"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
            />
            <Input
              label={`Amount (${currency})`}
              placeholder="0"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
            />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 6 }}>
                Repeats
              </Text>
              <SegmentedControl
                value={draft.freq}
                onChange={(freq) => setDraft({ ...draft, freq })}
                options={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
              />
            </View>
            <Input
              label="Next run date (ISO)"
              placeholder={new Date().toISOString().slice(0, 10)}
              value={draft.nextRunAt.slice(0, 10)}
              onChangeText={(d) => {
                const parsed = new Date(d);
                if (!Number.isNaN(parsed.getTime())) {
                  setDraft({ ...draft, nextRunAt: parsed.toISOString() });
                }
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: ink }}>Active</Text>
              <Toggle
                value={draft.active}
                onValueChange={(active) => setDraft({ ...draft, active })}
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
