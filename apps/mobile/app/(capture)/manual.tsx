// Screen 14. ManualEntryScreen — custom number pad + category/wallet pickers.
//
// Flow:
//   - amount entered via custom keypad (numeric, INR by default)
//   - category, wallet, group pickers via PickerSheet
//   - "AI suggest" chip → /ai/categorize w/ note + amount
//   - Save → POST /expenses (source: 'manual') → invalidate queries → dismiss

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { Screen, Card, Button } from '../../src/components/glass';
import { CaptureHeader, PickerSheet, type PickerItem } from '../../src/components/capture';
import { categories as categoriesApi, wallets as walletsApi, groups as groupsApi, expenses as expensesApi, ai } from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';
import { qk } from '../../src/query/client';
import { useAuth } from '../../src/store/auth';
import { radii } from '../../src/theme/tokens';
import { formatCurrency } from '../../src/lib/format';

interface KeyValue {
  label: string;
  digit?: string;
  action?: 'backspace' | 'dot';
}

const KEYS: KeyValue[] = [
  { label: '1', digit: '1' },
  { label: '2', digit: '2' },
  { label: '3', digit: '3' },
  { label: '4', digit: '4' },
  { label: '5', digit: '5' },
  { label: '6', digit: '6' },
  { label: '7', digit: '7' },
  { label: '8', digit: '8' },
  { label: '9', digit: '9' },
  { label: '.', action: 'dot' },
  { label: '0', digit: '0' },
  { label: '⌫', action: 'backspace' },
];

export default function ManualEntryScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQ = useQuery({
    queryKey: qk.categories,
    queryFn: () => categoriesApi.list(),
  });
  const walletsQ = useQuery({
    queryKey: qk.wallets,
    queryFn: () => walletsApi.list(),
  });
  const groupsQ = useQuery({
    queryKey: qk.groups,
    queryFn: () => groupsApi.list(),
  });

  // Auto-pick first wallet if user hasn't chosen one.
  const walletItems: PickerItem[] = useMemo(
    () =>
      (walletsQ.data ?? []).map((w) => ({
        id: w.id,
        label: w.name,
        sublabel: `${w.kind.toUpperCase()} · ${w.currency}`,
      })),
    [walletsQ.data],
  );
  const categoryItems: PickerItem[] = useMemo(
    () =>
      (categoriesQ.data ?? []).map((c) => ({
        id: c.id,
        label: c.name,
      })),
    [categoriesQ.data],
  );
  const groupItems: PickerItem[] = useMemo(
    () =>
      (groupsQ.data ?? []).map((g) => ({ id: g.id, label: g.name })),
    [groupsQ.data],
  );

  const selectedCategory = useMemo(
    () => categoryItems.find((c) => c.id === categoryId) ?? null,
    [categoryItems, categoryId],
  );
  const selectedWallet = useMemo(
    () => walletItems.find((w) => w.id === walletId) ?? null,
    [walletItems, walletId],
  );
  const selectedGroup = useMemo(
    () => groupItems.find((g) => g.id === groupId) ?? null,
    [groupItems, groupId],
  );

  const handleKey = useCallback((key: KeyValue) => {
    setAmount((prev) => {
      if (key.action === 'backspace') return prev.slice(0, -1);
      if (key.action === 'dot') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      if (key.digit !== undefined) {
        // limit decimals to 2 places
        if (prev.includes('.') && prev.split('.')[1]!.length >= 2) return prev;
        // avoid leading-zero like "0123" but allow "0." cases
        if (prev === '0' && key.digit !== '.') return key.digit;
        return prev + key.digit;
      }
      return prev;
    });
  }, []);

  const handleAiSuggest = useCallback(async () => {
    if (!amount) {
      setFormError('Add an amount first.');
      return;
    }
    setAiBusy(true);
    try {
      const res = await ai.categorize({
        amount,
        merchant: merchant || undefined,
        note: note || undefined,
      });
      if (res.categoryId) setCategoryId(res.categoryId);
    } catch {
      // Soft-fail — user can pick manually.
    } finally {
      setAiBusy(false);
    }
  }, [amount, merchant, note]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!walletId) throw new Error('Pick a wallet');
      if (!amount || Number(amount) <= 0) throw new Error('Add an amount');
      return expensesApi.create({
        amount,
        currency,
        merchant: merchant || undefined,
        note: note || undefined,
        occurredAt: new Date().toISOString(),
        categoryId: categoryId ?? undefined,
        walletId,
        groupId: groupId ?? undefined,
        source: 'manual',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.dismissAll();
      router.replace('/(tabs)/home');
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save. Try again.';
      setFormError(msg);
    },
  });

  const handleSave = useCallback(() => {
    setFormError(null);
    if (!amount || Number(amount) <= 0) {
      setFormError('Add an amount first.');
      return;
    }
    if (!walletId) {
      setFormError('Pick a wallet.');
      return;
    }
    createMutation.mutate();
  }, [amount, walletId, createMutation]);

  const amountDisplay = amount
    ? formatCurrency(Number(amount) || 0, currency)
    : currency === 'INR'
      ? '₹0'
      : `${currency} 0`;

  return (
    <Screen>
      <CaptureHeader title="Add expense" />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        {/* Amount display */}
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.4,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            AMOUNT
          </Text>
          <Text
            style={{
              fontSize: 44,
              fontWeight: '800',
              marginTop: 2,
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          >
            {amountDisplay}
          </Text>
        </View>

        {/* Pickers + inputs */}
        <View style={{ gap: 10, marginTop: 8 }}>
          <PickerRow
            label={selectedCategory?.label ?? 'Pick category'}
            placeholder={selectedCategory ? undefined : 'Category'}
            icon="pricetags-outline"
            onPress={() => setShowCategory(true)}
            trailing={
              <Pressable
                onPress={handleAiSuggest}
                disabled={aiBusy}
                style={({ pressed }) => ({
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: '#3B82F6',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  opacity: aiBusy ? 0.6 : pressed ? 0.85 : 1,
                })}
              >
                {aiBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                  AI suggest
                </Text>
              </Pressable>
            }
            isDark={isDark}
          />

          <PickerRow
            label={selectedWallet?.label ?? 'Pick wallet'}
            placeholder={selectedWallet ? undefined : 'Wallet'}
            icon="card-outline"
            onPress={() => setShowWallet(true)}
            isDark={isDark}
          />

          <PickerRow
            label={selectedGroup?.label ?? 'No group'}
            placeholder={selectedGroup ? undefined : 'Group (optional)'}
            icon="people-outline"
            onPress={() => setShowGroup(true)}
            isDark={isDark}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: radii.lg,
              backgroundColor: isDark ? '#1F2937' : '#F1F4F8',
            }}
          >
            <Ionicons name="storefront-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Merchant (optional)"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              style={{
                flex: 1,
                fontSize: 14,
                color: isDark ? '#F8FAFC' : '#0F172A',
                paddingVertical: 0,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: radii.lg,
              backgroundColor: isDark ? '#1F2937' : '#F1F4F8',
            }}
          >
            <Ionicons name="document-text-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              style={{
                flex: 1,
                fontSize: 14,
                color: isDark ? '#F8FAFC' : '#0F172A',
                paddingVertical: 0,
              }}
            />
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {formError && (
          <Card padded={false} style={{ marginBottom: 8 }}>
            <Text style={{ padding: 12, color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
              {formError}
            </Text>
          </Card>
        )}

        {/* Number pad */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {KEYS.map((k) => (
            <Pressable
              key={k.label}
              onPress={() => handleKey(k)}
              style={({ pressed }) => ({
                width: '32%',
                height: 48,
                borderRadius: radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ fontSize: 20, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {k.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          onPress={handleSave}
          loading={createMutation.isPending}
          fullWidth
          size="lg"
          leftIcon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          style={{ marginBottom: 16 }}
        >
          Save
        </Button>
      </View>

      <PickerSheet
        open={showCategory}
        onClose={() => setShowCategory(false)}
        title="Pick a category"
        items={categoryItems}
        selectedId={categoryId}
        onSelect={(it) => setCategoryId(it.id)}
        emptyLabel="No categories yet. Add one in Settings."
      />
      <PickerSheet
        open={showWallet}
        onClose={() => setShowWallet(false)}
        title="Pick a wallet"
        items={walletItems}
        selectedId={walletId}
        onSelect={(it) => setWalletId(it.id)}
        emptyLabel="No wallets yet. Add one in Settings."
      />
      <PickerSheet
        open={showGroup}
        onClose={() => setShowGroup(false)}
        title="Pick a group"
        items={[{ id: '', label: 'No group' }, ...groupItems]}
        selectedId={groupId ?? ''}
        onSelect={(it) => setGroupId(it.id || null)}
        emptyLabel="No groups yet."
      />
    </Screen>
  );
}

interface PickerRowProps {
  label: string;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  trailing?: React.ReactNode;
  isDark: boolean;
}

function PickerRow({ label, placeholder, icon, onPress, trailing, isDark }: PickerRowProps) {
  const isPlaceholder = !!placeholder;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: radii.lg,
        backgroundColor: isDark ? '#1F2937' : '#F1F4F8',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={isDark ? '#94A3B8' : '#64748B'} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: isPlaceholder
            ? isDark
              ? '#64748B'
              : '#94A3B8'
            : isDark
              ? '#F8FAFC'
              : '#0F172A',
        }}
      >
        {isPlaceholder ? placeholder : label}
      </Text>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#94A3B8' : '#94A3B8'} />
      )}
    </Pressable>
  );
}
