// Wallets list — hero gradient card per kind. Tap to edit, FAB to add.
// Balance shown as openingBalance for v1 (full balance computation deferred).

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Wallet, WalletKind } from '@voxpense/shared-types';

import { Screen, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import { FAB, ScreenHeader, SegmentedControl } from '../../src/components/settings';
import {
  useCreateWallet,
  useDeleteWallet,
  useUpdateWallet,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';

const KIND_GRADIENTS: Record<WalletKind, [string, string]> = {
  cash: ['#10B981', '#059669'],
  card: ['#6366F1', '#4338CA'],
  upi: ['#F59E0B', '#DC2626'],
  bank: ['#0EA5E9', '#0369A1'],
  other: ['#8B5CF6', '#6D28D9'],
};

const KIND_ICONS: Record<WalletKind, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  card: 'card-outline',
  upi: 'phone-portrait-outline',
  bank: 'business-outline',
  other: 'wallet-outline',
};

interface DraftWallet {
  id?: string;
  name: string;
  kind: WalletKind;
  openingBalance: string;
}

const DEFAULT_DRAFT: DraftWallet = {
  name: '',
  kind: 'cash',
  openingBalance: '0',
};

export default function WalletsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const wallets = useWallets();
  const create = useCreateWallet();
  const update = useUpdateWallet();
  const remove = useDeleteWallet();

  const [draft, setDraft] = useState<DraftWallet | null>(null);
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const openEdit = (w: Wallet) => {
    setDraft({
      id: w.id,
      name: w.name,
      kind: w.kind,
      openingBalance: w.openingBalance,
    });
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Alert.alert('Missing name', 'Add a wallet name.');
      return;
    }
    if (Number.isNaN(Number(draft.openingBalance))) {
      Alert.alert('Bad amount', 'Opening balance must be numeric.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name,
            kind: draft.kind,
            openingBalance: draft.openingBalance,
          },
        });
      } else {
        await create.mutateAsync({
          name: draft.name,
          kind: draft.kind,
          currency,
          openingBalance: draft.openingBalance,
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete wallet?',
      'This will fail if expenses reference this wallet.',
      [
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
      ],
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Wallets" />
      {wallets.isLoading ? (
        <LoadingView />
      ) : (wallets.data ?? []).length === 0 ? (
        <EmptyView
          title="No wallets yet"
          body="Add cash, cards, bank accounts to track where your money lives."
          action={{ label: 'Add wallet', onPress: () => setDraft({ ...DEFAULT_DRAFT }) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
          {(wallets.data ?? []).map((w) => {
            const grad = KIND_GRADIENTS[w.kind];
            return (
              <Pressable
                key={w.id}
                onPress={() => openEdit(w)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <LinearGradient
                  colors={grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 20,
                    overflow: 'hidden',
                    shadowColor: grad[1],
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {w.kind}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#FFFFFF',
                          marginTop: 2,
                        }}
                      >
                        {w.name}
                      </Text>
                    </View>
                    <Ionicons name={KIND_ICONS[w.kind]} size={24} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      marginTop: 24,
                    }}
                  >
                    {formatCurrency(w.openingBalance, w.currency || currency)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      marginTop: 2,
                    }}
                  >
                    Opening balance · {w.currency || currency}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
          <Text
            style={{
              fontSize: 11,
              color: meta,
              textAlign: 'center',
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            Live balance computation coming in v1.1.
          </Text>
        </ScrollView>
      )}
      <FAB onPress={() => setDraft({ ...DEFAULT_DRAFT })} />

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit wallet' : 'New wallet'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. HDFC Debit"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
            />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 6 }}>
                Kind
              </Text>
              <SegmentedControl
                value={draft.kind}
                onChange={(kind) => setDraft({ ...draft, kind })}
                options={[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Card', value: 'card' },
                  { label: 'UPI', value: 'upi' },
                  { label: 'Bank', value: 'bank' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </View>
            <Input
              label={`Opening balance (${currency})`}
              placeholder="0"
              keyboardType="decimal-pad"
              value={draft.openingBalance}
              onChangeText={(openingBalance) => setDraft({ ...draft, openingBalance })}
            />
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
