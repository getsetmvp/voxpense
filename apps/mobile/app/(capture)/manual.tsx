// Screen 14. ManualEntryScreen — pixel-match rebuild of mockup 14.
//
// Layout:
//   - Header: back arrow + "Add expense" + spacer
//   - Center: ₹AMOUNT.00 hero number
//   - Rows: category (with AI suggest chip on right), wallet, merchant, note
//   - Bottom: custom 3-col 12-key number pad + Save button (full-width brand)
//
// On Save:
//   - validate amount > 0 + wallet present
//   - POST /expenses (source: 'manual') → invalidate ['expenses'] → dismissAll + replace home

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Card, Button } from '../../src/components/glass';
import { CaptureHeader, PickerSheet, type PickerItem } from '../../src/components/capture';
import {
  categories as categoriesApi,
  wallets as walletsApi,
  groups as groupsApi,
  expenses as expensesApi,
  ai,
} from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';
import { qk } from '../../src/query/client';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';

// ─────────────────────────────────────────────────────────────────────────────
// Keypad config — 4 rows of 3 keys (digits, then `. 0 ⌫`)
type KeyValue =
  | { kind: 'digit'; label: string; digit: string }
  | { kind: 'dot'; label: '.' }
  | { kind: 'back'; label: '⌫' };

const KEYS: KeyValue[] = [
  { kind: 'digit', label: '1', digit: '1' },
  { kind: 'digit', label: '2', digit: '2' },
  { kind: 'digit', label: '3', digit: '3' },
  { kind: 'digit', label: '4', digit: '4' },
  { kind: 'digit', label: '5', digit: '5' },
  { kind: 'digit', label: '6', digit: '6' },
  { kind: 'digit', label: '7', digit: '7' },
  { kind: 'digit', label: '8', digit: '8' },
  { kind: 'digit', label: '9', digit: '9' },
  { kind: 'dot', label: '.' },
  { kind: 'digit', label: '0', digit: '0' },
  { kind: 'back', label: '⌫' },
];

// Static row styles (function-form Pressable is fine for keypad keys since
// they're not layout-bearing — but we keep style derivation deterministic).
const ROW_BG_LIGHT = '#F1F4F8';
const ROW_BG_DARK = '#1F2937';

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
    () => (categoriesQ.data ?? []).map((c) => ({ id: c.id, label: c.name })),
    [categoriesQ.data],
  );
  const groupItems: PickerItem[] = useMemo(
    () => (groupsQ.data ?? []).map((g) => ({ id: g.id, label: g.name })),
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
      if (key.kind === 'back') return prev.slice(0, -1);
      if (key.kind === 'dot') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      // digit
      if (prev.includes('.') && prev.split('.')[1]!.length >= 2) return prev;
      if (prev === '0' && key.digit !== '.') return key.digit;
      return prev + key.digit;
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
      // Soft-fail — user picks manually.
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

  // Split amount into whole + decimal parts for hero display.
  const { whole, decimal } = useMemo(() => splitAmount(amount, currency), [amount, currency]);

  const rowBg = isDark ? ROW_BG_DARK : ROW_BG_LIGHT;
  const inkPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const inkSecondary = isDark ? '#94A3B8' : '#64748B';
  const inkPlaceholder = isDark ? '#64748B' : '#94A3B8';

  return (
    <Screen>
      <CaptureHeader title="Add expense" rightAccessory={<View style={{ width: 40 }} />} />

      <View className="flex-1 px-5 pt-2">
        {/* Hero amount */}
        <View className="items-center py-2">
          <Text
            className="text-[11px] font-bold tracking-widest"
            style={{ color: inkSecondary }}
          >
            AMOUNT
          </Text>
          <View className="flex-row items-baseline mt-1">
            <Text className="text-5xl font-extrabold" style={{ color: inkPrimary }}>
              {whole}
            </Text>
            <Text className="text-2xl font-bold" style={{ color: inkSecondary }}>
              {decimal}
            </Text>
          </View>
        </View>

        {/* Rows */}
        <View className="mt-3" style={{ gap: 8 }}>
          {/* Category row with AI suggest chip */}
          <PickerRow
            label={selectedCategory?.label ?? 'Pick a category'}
            placeholder={!selectedCategory}
            icon="pricetags-outline"
            onPress={() => setShowCategory(true)}
            isDark={isDark}
            rowBg={rowBg}
            trailing={
              <Pressable
                onPress={handleAiSuggest}
                disabled={aiBusy}
                style={AI_CHIP_STYLE}
              >
                {aiBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                )}
                <Text className="text-white text-[11px] font-bold ml-1">
                  AI suggest
                </Text>
              </Pressable>
            }
          />

          {/* Wallet row */}
          <PickerRow
            label={selectedWallet?.label ?? 'Pick a wallet'}
            placeholder={!selectedWallet}
            icon="card-outline"
            onPress={() => setShowWallet(true)}
            isDark={isDark}
            rowBg={rowBg}
          />

          {/* Group row (optional) */}
          <PickerRow
            label={selectedGroup?.label ?? 'No group'}
            placeholder={!selectedGroup}
            icon="people-outline"
            onPress={() => setShowGroup(true)}
            isDark={isDark}
            rowBg={rowBg}
          />

          {/* Merchant input */}
          <View
            className="flex-row items-center p-3"
            style={{ gap: 10, borderRadius: 14, backgroundColor: rowBg }}
          >
            <Ionicons name="storefront-outline" size={18} color={inkSecondary} />
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Merchant (optional)"
              placeholderTextColor={inkPlaceholder}
              style={{ flex: 1, fontSize: 14, color: inkPrimary, paddingVertical: 0 }}
            />
          </View>

          {/* Note input */}
          <View
            className="flex-row items-center p-3"
            style={{ gap: 10, borderRadius: 14, backgroundColor: rowBg }}
          >
            <Ionicons name="document-text-outline" size={18} color={inkSecondary} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              placeholderTextColor={inkPlaceholder}
              style={{ flex: 1, fontSize: 14, color: inkPrimary, paddingVertical: 0 }}
            />
          </View>
        </View>

        <View className="flex-1" />

        {formError && (
          <Card padded={false} style={{ marginBottom: 8 }}>
            <Text className="p-3 text-[#EF4444] text-[13px] font-semibold">
              {formError}
            </Text>
          </Card>
        )}

        {/* Number pad: 3-col grid, 4 rows */}
        <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
          {KEYS.map((k) => (
            <NumKey
              key={k.label}
              label={k.label}
              isDark={isDark}
              onPress={() => handleKey(k)}
              isBackspace={k.kind === 'back'}
            />
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

// ─────────────────────────────────────────────────────────────────────────────

const AI_CHIP_STYLE = {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: '#3B82F6',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

function splitAmount(raw: string, currency: string): { whole: string; decimal: string } {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  if (!raw) return { whole: `${sym}0`, decimal: '.00' };
  if (raw.endsWith('.')) {
    const wholeFormatted = formatCurrency(Number(raw.slice(0, -1) || 0), currency).split('.')[0]!;
    return { whole: wholeFormatted, decimal: '.' };
  }
  if (raw.includes('.')) {
    const [w, d] = raw.split('.');
    const wholeFormatted = formatCurrency(Number(w || 0), currency).split('.')[0]!;
    return { whole: wholeFormatted, decimal: `.${d ?? ''}` };
  }
  const formatted = formatCurrency(Number(raw) || 0, currency);
  if (formatted.includes('.')) {
    const [w, d] = formatted.split('.');
    return { whole: w!, decimal: `.${d!}` };
  }
  return { whole: formatted, decimal: '.00' };
}

interface PickerRowProps {
  label: string;
  placeholder?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  trailing?: React.ReactNode;
  isDark: boolean;
  rowBg: string;
}

function PickerRow({ label, placeholder, icon, onPress, trailing, isDark, rowBg }: PickerRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        ROW_STATIC_STYLE,
        { backgroundColor: rowBg },
      ]}
    >
      <Ionicons name={icon} size={18} color={isDark ? '#94A3B8' : '#64748B'} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: placeholder
            ? isDark ? '#64748B' : '#94A3B8'
            : isDark ? '#F8FAFC' : '#0F172A',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#94A3B8' : '#94A3B8'} />
      )}
    </Pressable>
  );
}

// STATIC array-form style — layout-bearing Pressable per scope rules.
const ROW_STATIC_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  padding: 12,
  borderRadius: 14,
};

interface NumKeyProps {
  label: string;
  onPress: () => void;
  isDark: boolean;
  isBackspace: boolean;
}

function NumKey({ label, onPress, isDark, isBackspace }: NumKeyProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        NUMKEY_STATIC_STYLE,
        {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        },
      ]}
    >
      {isBackspace ? (
        <Ionicons name="backspace-outline" size={22} color={isDark ? '#F8FAFC' : '#0F172A'} />
      ) : (
        <Text
          style={{
            fontSize: 22,
            fontWeight: '600',
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// STATIC array-form style — layout-bearing Pressable.
const NUMKEY_STATIC_STYLE = {
  width: '32%' as const,
  height: 52,
  borderRadius: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 1,
};
