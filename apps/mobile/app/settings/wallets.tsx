// Wallets settings — list + inline new/edit sheet + delete confirm.

import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import {
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet as WalletIcon,
  Plus,
} from 'lucide-react-native';
import type { Wallet, WalletKind } from '@voxpense/shared-types';

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
  useWallets,
  useCreateWallet,
  useUpdateWallet,
  useDeleteWallet,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatMoney } from '../../src/lib/money';
import { SEED_CURRENCIES } from '../../src/lib/currencies';

const KIND_LABELS: Record<WalletKind, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank: 'Bank',
  other: 'Other',
};

const KIND_OPTIONS: WalletKind[] = ['cash', 'card', 'upi', 'bank', 'other'];

function KindIcon({ kind, size = 18, color }: { kind: WalletKind; size?: number; color: string }) {
  switch (kind) {
    case 'cash':
      return <Banknote size={size} color={color} />;
    case 'card':
      return <CreditCard size={size} color={color} />;
    case 'upi':
      return <Smartphone size={size} color={color} />;
    case 'bank':
      return <Landmark size={size} color={color} />;
    default:
      return <WalletIcon size={size} color={color} />;
  }
}

interface Draft {
  id?: string;
  name: string;
  kind: WalletKind;
  openingBalance: string;
  currency: string;
}

export default function WalletsSettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');

  const q = useWallets();
  const create = useCreateWallet();
  const update = useUpdateWallet();
  const remove = useDeleteWallet();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pickCurrency, setPickCurrency] = useState(false);

  const wallets = q.data ?? [];

  const openNew = () =>
    setDraft({ name: '', kind: 'cash', openingBalance: '0', currency: baseCurrency });

  const openEdit = (w: Wallet) =>
    setDraft({
      id: w.id,
      name: w.name,
      kind: w.kind,
      openingBalance: w.openingBalance ?? '0',
      currency: w.currency ?? baseCurrency,
    });

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.show('Name required', 'bad');
      return;
    }
    if (Number.isNaN(Number(draft.openingBalance))) {
      toast.show('Balance must be numeric', 'bad');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name.trim(),
            kind: draft.kind,
            openingBalance: draft.openingBalance,
          },
        });
        toast.show('Wallet saved', 'good');
      } else {
        await create.mutateAsync({
          name: draft.name.trim(),
          kind: draft.kind,
          currency: draft.currency,
          openingBalance: draft.openingBalance,
        });
        toast.show('Wallet created', 'good');
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
      toast.show('Wallet deleted', 'good');
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
        title="Wallets"
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
              <Skeleton key={i} style={{ height: 60, borderRadius: 16 }} />
            ))}
          </View>
        ) : wallets.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={28} color={tokens.brand} />}
            title="No wallets yet"
            body="Add cash, cards, bank accounts to track where your money lives."
            action={<Button label="Add wallet" variant="brand" fullWidth={false} onPress={openNew} />}
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
            {wallets.map((w, i) => {
              const bal = Number(w.openingBalance ?? '0');
              return (
                <View key={w.id}>
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
                        <KindIcon kind={w.kind} color={tokens.brand} />
                      </View>
                    }
                    title={w.name}
                    subtitle={`${KIND_LABELS[w.kind]} · ${w.currency ?? baseCurrency}`}
                    trailingText={formatMoney(bal, w.currency ?? baseCurrency)}
                    onPress={() => openEdit(w)}
                  />
                  {i < wallets.length - 1 ? (
                    <View
                      style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={80}>
        {draft && (
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
              {draft.id ? 'Edit wallet' : 'New wallet'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. HDFC Debit"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              autoCapitalize="words"
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
                Kind
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {KIND_OPTIONS.map((k) => {
                  const selected = draft.kind === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setDraft({ ...draft, kind: k })}
                      style={{
                        width: '23%',
                        aspectRatio: 1.1,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : tokens.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <KindIcon
                        kind={k}
                        size={20}
                        color={selected ? tokens.brand : tokens.ink}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: selected ? tokens.brand : tokens.ink,
                        }}
                      >
                        {KIND_LABELS[k]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Input
              label={`Opening balance (${draft.currency})`}
              placeholder="0"
              keyboardType="decimal-pad"
              value={draft.openingBalance}
              onChangeText={(openingBalance) => setDraft({ ...draft, openingBalance })}
            />
            {!draft.id ? (
              <Pressable onPress={() => setPickCurrency(true)}>
                <View pointerEvents="none">
                  <Input label="Currency" value={draft.currency} editable={false} />
                </View>
              </Pressable>
            ) : null}
            <View style={{ height: 8 }} />
            <Button
              label={draft.id ? 'Save changes' : 'Create wallet'}
              onPress={submit}
              loading={create.isPending || update.isPending}
            />
            {draft.id ? (
              <Button
                label="Delete wallet"
                variant="danger"
                onPress={() => setConfirmDelete(draft.id!)}
              />
            ) : null}
            <Button label="Cancel" variant="ghost" onPress={() => setDraft(null)} />
          </ScrollView>
        )}
      </Sheet>

      <Sheet visible={pickCurrency} onClose={() => setPickCurrency(false)} heightPct={70}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 12,
            color: tokens.ink,
          }}
        >
          Currency
        </Text>
        <ScrollView contentContainerStyle={{ gap: 4, paddingBottom: 24 }}>
          {SEED_CURRENCIES.map((c) => {
            const selected = draft?.currency === c.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  if (draft) setDraft({ ...draft, currency: c.code });
                  setPickCurrency(false);
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? tokens.brand : tokens.border,
                  backgroundColor: selected ? `${tokens.brand}14` : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink, width: 32 }}>
                  {c.symbol}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.ink }}>
                    {c.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: tokens.muted }}>{c.name}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="Delete wallet?"
        message="This will fail if expenses still reference this wallet."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </Screen>
  );
}
