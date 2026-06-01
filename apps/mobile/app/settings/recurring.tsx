// Recurring list — pixel-match mockup §7 screen 20 + 21 (edit sheet).
// Layout: header (back + title + plus) → card rows with avatar icon +
// name (+ paused chip) + "freq · wallet" subtitle + amount + Next:date.
// Paused rows render at 60% opacity. Plus-button in header + bottom-right
// FAB both open the edit sheet.

import { useState } from 'react';
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
import type { Recurring } from '@voxpense/shared-types';

import {
  Screen,
  Button,
  Input,
  Sheet,
  LoadingView,
  EmptyView,
} from '../../src/components/glass';
import { SegmentedControl, Toggle } from '../../src/components/settings';
import {
  useCategories,
  useCreateRecurring,
  useDeleteRecurring,
  useRecurring,
  useUpdateRecurring,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { shadows } from '../../src/theme/tokens';

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

function freqLabel(freq: Freq): string {
  const map: Record<Freq, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };
  return map[freq];
}

interface DraftRecurring {
  id?: string;
  name: string;
  amount: string;
  freq: Freq;
  nextRunAt: string;
  walletId: string;
  categoryId: string | null;
  active: boolean;
}

const ROW_PRESSABLE_STYLE = [{ marginBottom: 0 }];
const HEADER_BTN_STYLE_BASE = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export default function RecurringScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const recurring = useRecurring();
  const wallets = useWallets();
  const cats = useCategories();
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const remove = useDeleteRecurring();

  const [draft, setDraft] = useState<DraftRecurring | null>(null);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const surf = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  const defaultDraft = (): DraftRecurring => {
    const firstWalletId = wallets.data?.[0]?.id ?? '';
    return {
      name: '',
      amount: '',
      freq: 'monthly',
      nextRunAt: new Date().toISOString(),
      walletId: firstWalletId,
      categoryId: null,
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
      categoryId: r.categoryId,
      active: r.active,
    });
  };

  const walletName = (id: string): string =>
    wallets.data?.find((w) => w.id === id)?.name ?? 'Wallet';

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
            categoryId: draft.categoryId,
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
          categoryId: draft.categoryId ?? undefined,
          active: draft.active,
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const toggleActive = async (r: Recurring) => {
    try {
      await update.mutateAsync({ id: r.id, body: { active: !r.active } });
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again.');
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

  const iconColor = (r: Recurring): string => {
    if (!r.active) return '#94A3B8';
    return cats.data?.find((c) => c.id === r.categoryId)?.color ?? '#3B82F6';
  };

  return (
    <Screen>
      {/* Mockup header */}
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
        <Text style={{ fontSize: 16, fontWeight: '600', color: ink }}>Recurring</Text>
        <Pressable
          onPress={() => setDraft(defaultDraft())}
          style={[HEADER_BTN_STYLE_BASE, { backgroundColor: brand }]}
          accessibilityLabel="Add recurring"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {recurring.isLoading ? (
        <LoadingView />
      ) : (recurring.data ?? []).length === 0 ? (
        <EmptyView
          title="No recurring entries"
          body="Add subscriptions, rent, and other repeating expenses."
          action={{ label: 'Add recurring', onPress: () => setDraft(defaultDraft()) }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 10 }}
        >
          {(recurring.data ?? []).map((r) => {
            const color = iconColor(r);
            const iconBg = `${color}26`;
            const freq = rruleToFreq(r.rrule);
            return (
              <Pressable
                key={r.id}
                onPress={() => openEdit(r)}
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
                    opacity: r.active ? 1 : 0.6,
                    ...shadows.card,
                  }}
                >
                  <View
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
                        gap: 12,
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 16,
                          backgroundColor: iconBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={r.active ? 'repeat' : 'pause-circle-outline'}
                          size={20}
                          color={color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Text
                            style={{ fontSize: 14, fontWeight: '600', color: ink }}
                            numberOfLines={1}
                          >
                            {r.name}
                          </Text>
                          {!r.active && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 999,
                                backgroundColor: isDark
                                  ? 'rgba(148,163,184,0.2)'
                                  : 'rgba(148,163,184,0.18)',
                              }}
                            >
                              <Text
                                style={{ fontSize: 10, fontWeight: '600', color: meta }}
                              >
                                paused
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {/* Frequency chip */}
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 999,
                              backgroundColor: isDark
                                ? 'rgba(96,165,250,0.18)'
                                : 'rgba(59,130,246,0.12)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: brand,
                              }}
                            >
                              {freqLabel(freq)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: meta }} numberOfLines={1}>
                            · {walletName(r.walletId)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: ink }}>
                        {formatCurrency(r.amount, currency)}
                      </Text>
                      <Text
                        style={{ fontSize: 10, color: meta, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        Next: {formatDate(r.nextRunAt, 'd MMM')}
                      </Text>
                    </View>
                  </View>
                  {/* Active toggle row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(15,23,42,0.06)',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: meta }}>
                      {r.active ? 'Active' : 'Paused'}
                    </Text>
                    <Toggle value={r.active} onValueChange={() => toggleActive(r)} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom-right FAB — spec-mandated pattern */}
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
            onPress={() => setDraft(defaultDraft())}
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
            accessibilityLabel="Add recurring"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

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
              label="Next run date (YYYY-MM-DD)"
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
