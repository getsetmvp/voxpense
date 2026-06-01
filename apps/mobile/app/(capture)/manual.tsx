// Manual entry (mockup 12). Form: large amount input + merchant + note +
// group chip row + wallet chip row + occurredAt pill + Save.

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Calendar, Check, Store, StickyNote } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { useGroups, useWallets } from '../../src/queries/insights';
import { useCreateExpense } from '../../src/queries/expenses';
import { symbolOf } from '../../src/lib/money';
import { formatRelativeDate } from '../../src/lib/format';

export default function ManualEntryScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');

  const groupsQ = useGroups();
  const walletsQ = useWallets();
  const groups = groupsQ.data ?? [];
  const wallets = walletsQ.data ?? [];

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [occurredAt] = useState<string>(new Date().toISOString());

  // Default to first wallet when list loads.
  const initialWalletId = useMemo(() => {
    if (walletId) return walletId;
    return wallets[0]?.id ?? null;
  }, [walletId, wallets]);

  const create = useCreateExpense();

  const onSave = async () => {
    const num = Number(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      toast.show('Enter an amount', 'bad');
      return;
    }
    const wId = walletId ?? initialWalletId;
    if (!wId) {
      toast.show('Add a wallet in settings first', 'bad');
      return;
    }
    try {
      await create.mutateAsync({
        amount: num.toFixed(2),
        currency: baseCurrency,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        occurredAt,
        groupId: groupId ?? undefined,
        walletId: wId,
        source: 'manual',
      });
      toast.show('Saved', 'good');
      router.replace('/(tabs)/home');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  return (
    <Screen edges={['top']}>
      <Header title="New expense" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount hero */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: tokens.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Amount
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              marginTop: 8,
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: tokens.muted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {symbolOf(baseCurrency)}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={tokens.muted}
              style={{
                fontSize: 48,
                fontWeight: '700',
                color: tokens.ink,
                fontVariant: ['tabular-nums'],
                minWidth: 80,
                textAlign: 'center',
                paddingVertical: 0,
              }}
            />
          </View>
        </View>

        {/* Merchant */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 12,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 8,
          }}
        >
          <Store size={18} color={tokens.muted} />
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Where was this?"
            placeholderTextColor={tokens.muted}
            style={{
              flex: 1,
              fontSize: 14,
              color: tokens.ink,
              paddingVertical: 0,
            }}
          />
        </View>

        {/* Note */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 12,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 16,
          }}
        >
          <StickyNote size={18} color={tokens.muted} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={tokens.muted}
            style={{
              flex: 1,
              fontSize: 14,
              color: tokens.ink,
              paddingVertical: 0,
            }}
          />
        </View>

        {/* Group chip row */}
        <SectionHeader>Group</SectionHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          style={{ marginBottom: 12 }}
        >
          <Pressable onPress={() => setGroupId(null)}>
            <Chip
              label="None"
              variant={groupId === null ? 'solid' : 'default'}
            />
          </Pressable>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => setGroupId(g.id)}>
              <Chip
                label={g.name}
                variant={groupId === g.id ? 'solid' : 'default'}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Wallet chip row */}
        <SectionHeader>Wallet</SectionHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          style={{ marginBottom: 16 }}
        >
          {wallets.length === 0 ? (
            <Text style={{ fontSize: 13, color: tokens.muted, paddingVertical: 8 }}>
              No wallets — add one in settings.
            </Text>
          ) : (
            wallets.map((w) => {
              const selected = (walletId ?? initialWalletId) === w.id;
              return (
                <Pressable key={w.id} onPress={() => setWalletId(w.id)}>
                  <Chip
                    label={w.name}
                    variant={selected ? 'solid' : 'default'}
                  />
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* Date pill */}
        <SectionHeader>When</SectionHeader>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 12,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 24,
          }}
        >
          <Calendar size={18} color={tokens.muted} />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: '500',
              color: tokens.ink,
            }}
          >
            {formatRelativeDate(occurredAt)}
          </Text>
        </View>

        <Button
          label={create.isPending ? 'Saving…' : 'Save expense'}
          variant="brand"
          loading={create.isPending}
          onPress={onSave}
          icon={<Check size={18} color="#FFFFFF" />}
        />
      </ScrollView>
    </Screen>
  );
}
