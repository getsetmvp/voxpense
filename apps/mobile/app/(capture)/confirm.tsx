// Parse review (mockup 09 + 11). Receives parsed payload as route params,
// lets user edit fields before saving via useCreateExpense().

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Calendar, Check, Store, StickyNote } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Amount } from '../../src/components/ui/Amount';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { useGroups, useWallets } from '../../src/queries/insights';
import { useCreateExpense } from '../../src/queries/expenses';
import { formatRelativeDate } from '../../src/lib/format';

type SourceParam = 'voice' | 'photo' | 'manual' | 'recurring';

export default function ConfirmScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'INR');

  const params = useLocalSearchParams<{
    source?: string;
    transcript?: string;
    amount?: string;
    currency?: string;
    merchant?: string;
    note?: string;
    occurredAt?: string;
    categoryHint?: string;
  }>();

  const source: SourceParam = ((params.source as SourceParam) ?? 'voice');

  const groupsQ = useGroups();
  const walletsQ = useWallets();
  const groups = groupsQ.data ?? [];
  const wallets = walletsQ.data ?? [];

  const [amount, setAmount] = useState<string>(params.amount ?? '');
  const [currency] = useState<string>(params.currency || baseCurrency);
  const [merchant, setMerchant] = useState<string>(params.merchant ?? '');
  const [note, setNote] = useState<string>(params.note ?? '');
  const [occurredAt, setOccurredAt] = useState<string>(
    params.occurredAt && params.occurredAt.length > 0
      ? params.occurredAt
      : new Date().toISOString(),
  );
  const [groupId, setGroupId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

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
        currency,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        occurredAt,
        groupId: groupId ?? undefined,
        walletId: wId,
        source,
        parseMeta:
          params.transcript || params.categoryHint
            ? {
                transcript: params.transcript,
                categoryHint: params.categoryHint,
              }
            : undefined,
      });
      toast.show('Saved', 'good');
      router.replace('/(tabs)/home');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  const amountNum = Number(amount) || 0;

  return (
    <Screen edges={['top']}>
      <Header title="Review" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero: detected amount */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 24,
            borderRadius: 24,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: tokens.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Detected amount
          </Text>
          <View style={{ marginTop: 8 }}>
            <Amount value={amountNum} currency={currency} size={36} weight="700" />
          </View>
          {params.categoryHint ? (
            <View style={{ marginTop: 12 }}>
              <Chip label={params.categoryHint} variant="good" />
            </View>
          ) : null}
          {/* Editable raw amount */}
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="Edit amount"
            placeholderTextColor={tokens.muted}
            style={{
              marginTop: 12,
              minWidth: 120,
              height: 36,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: tokens.border,
              paddingHorizontal: 10,
              color: tokens.ink,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          />
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

        {/* Group selector */}
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

        {/* Wallet selector */}
        <SectionHeader>Wallet</SectionHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          style={{ marginBottom: 16 }}
        >
          {wallets.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: tokens.muted,
                paddingVertical: 8,
              }}
            >
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

        {/* Date */}
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
            marginBottom: 16,
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
          <Pressable
            onPress={() => setOccurredAt(new Date().toISOString())}
            hitSlop={6}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: tokens.brand,
              }}
            >
              Now
            </Text>
          </Pressable>
        </View>

        {/* Voice transcript echo */}
        {source === 'voice' && params.transcript ? (
          <View
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: tokens.surface,
              borderWidth: 1,
              borderColor: tokens.border,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: tokens.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              From your voice
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                color: tokens.ink,
              }}
            >
              "{params.transcript}"
            </Text>
          </View>
        ) : (
          <View style={{ height: 8 }} />
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              label={create.isPending ? 'Saving…' : 'Save'}
              variant="brand"
              loading={create.isPending}
              onPress={onSave}
              icon={<Check size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
