// Screen 11 + 13. AI Confirm — pixel-match rebuild matching mockup 11 (voice)
// and 13 (photo) flavors.
//
// Layout:
//   - Header: back arrow + "Confirm expense" + close X
//   - Hero glass card: DETECTED AMOUNT label + huge ₹AMOUNT + category chip +
//     confidence chip (when parse-meta supplies it)
//   - Section rows: merchant edit, note edit, category picker, wallet picker,
//     date row (Now), and (voice-only) "From your voice" transcript echo
//   - Footer: Cancel (ghost) + Save expense (primary 2x flex)
//
// Save: POST /expenses → invalidate ['expenses'] → dismissAll + replace home.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Card, Button } from '../../src/components/glass';
import { CaptureHeader, PickerSheet, type PickerItem } from '../../src/components/capture';
import {
  ai,
  categories as categoriesApi,
  wallets as walletsApi,
  expenses as expensesApi,
  type ParsedExpense,
  type ParsedReceipt,
} from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';
import { qk } from '../../src/query/client';
import { useAuth } from '../../src/store/auth';
import { formatCurrency, formatRelativeDate } from '../../src/lib/format';

type CaptureSource = 'voice' | 'photo';

interface ConfirmPayload {
  source: CaptureSource;
  transcript?: string;
  parsed: ParsedExpense | ParsedReceipt;
}

function safeParsePayload(raw: string | null | undefined): ConfirmPayload | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as ConfirmPayload;
    if (!obj || typeof obj !== 'object' || !obj.parsed) return null;
    return obj;
  } catch {
    return null;
  }
}

export default function ConfirmScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const baseCurrency = user?.baseCurrency ?? 'INR';

  const params = useLocalSearchParams<{ source?: string; payload?: string }>();
  const payload = useMemo(() => safeParsePayload(params.payload ?? null), [params.payload]);

  const parsed = payload?.parsed ?? null;
  const source: CaptureSource = (payload?.source ?? (params.source as CaptureSource) ?? 'voice') as CaptureSource;

  const [amount, setAmount] = useState<string>(parsed?.amount ?? '');
  const [currency, setCurrency] = useState<string>(parsed?.currency ?? baseCurrency);
  const [merchant, setMerchant] = useState<string>(parsed?.merchant ?? '');
  const [note, setNote] = useState<string>(parsed?.note ?? '');
  const [occurredAt, setOccurredAt] = useState<string>(
    parsed?.occurredAt ?? new Date().toISOString(),
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  const [showCategory, setShowCategory] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQ = useQuery({ queryKey: qk.categories, queryFn: () => categoriesApi.list() });
  const walletsQ = useQuery({ queryKey: qk.wallets, queryFn: () => walletsApi.list() });

  const categoryItems: PickerItem[] = useMemo(
    () => (categoriesQ.data ?? []).map((c) => ({ id: c.id, label: c.name })),
    [categoriesQ.data],
  );
  const walletItems: PickerItem[] = useMemo(
    () =>
      (walletsQ.data ?? []).map((w) => ({
        id: w.id,
        label: w.name,
        sublabel: `${w.kind.toUpperCase()} · ${w.currency}`,
      })),
    [walletsQ.data],
  );

  const selectedCategory = useMemo(
    () => categoryItems.find((c) => c.id === categoryId) ?? null,
    [categoryItems, categoryId],
  );
  const selectedWallet = useMemo(
    () => walletItems.find((w) => w.id === walletId) ?? null,
    [walletItems, walletId],
  );

  // Auto-suggest category on first arrival.
  useEffect(() => {
    let cancelled = false;
    async function suggest() {
      if (categoryId) return;
      if (!parsed) return;
      if (!amount) return;
      if ((categoriesQ.data?.length ?? 0) === 0) return;
      setAiBusy(true);
      try {
        const res = await ai.categorize({
          amount,
          merchant: merchant || undefined,
          note: note || undefined,
        });
        if (!cancelled && res.categoryId) setCategoryId(res.categoryId);
      } catch {
        // Soft-fail.
      } finally {
        if (!cancelled) setAiBusy(false);
      }
    }
    void suggest();
    return () => {
      cancelled = true;
    };
    // Only re-run on first arrival of parsed/categories.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, categoriesQ.data?.length]);

  // Default wallet to first available if user hasn't picked one.
  useEffect(() => {
    if (!walletId && walletsQ.data && walletsQ.data.length > 0) {
      setWalletId(walletsQ.data[0]!.id);
    }
  }, [walletId, walletsQ.data]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!amount || Number(amount) <= 0) throw new Error('Add an amount.');
      if (!walletId) throw new Error('Pick a wallet.');
      if (!categoryId) throw new Error('Pick a category.');
      return expensesApi.create({
        amount,
        currency,
        merchant: merchant || undefined,
        note: note || undefined,
        occurredAt,
        categoryId,
        walletId,
        source,
        parseMeta: parsed
          ? {
              transcript: payload?.transcript,
              parsed_amount: parsed.amount,
              parsed_merchant: parsed.merchant,
              parsed_category_hint: parsed.category_hint,
            }
          : undefined,
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
      setFormError('Add an amount before saving.');
      return;
    }
    if (!categoryId) {
      setFormError('Pick a category.');
      return;
    }
    if (!walletId) {
      setFormError('Pick a wallet.');
      return;
    }
    createMutation.mutate();
  }, [amount, walletId, categoryId, createMutation]);

  // Helpers
  const inkPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const inkSecondary = isDark ? '#94A3B8' : '#64748B';
  const inkPlaceholder = isDark ? '#64748B' : '#94A3B8';
  const rowBg = isDark ? '#1F2937' : '#F1F4F8';
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)';

  if (!payload || !parsed) {
    return (
      <Screen>
        <CaptureHeader title="Confirm" />
        <View className="flex-1 items-center justify-center p-6" style={{ gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={48} color={isDark ? '#FCA5A5' : '#EF4444'} />
          <Text className="text-base font-bold" style={{ color: inkPrimary }}>
            No parsed expense found
          </Text>
          <Text className="text-[13px] text-center" style={{ color: inkSecondary }}>
            The previous step did not pass an expense. Start over to try again.
          </Text>
          <Button onPress={() => router.replace('/(tabs)/home')}>Back to home</Button>
        </View>
      </Screen>
    );
  }

  const formattedAmount = formatCurrency(Number(amount) || 0, currency);

  return (
    <Screen>
      <CaptureHeader title="Confirm expense" />

      <View className="flex-1 px-5">
        {/* Hero glass card */}
        <View
          className="p-6 mt-1 overflow-hidden"
          style={{
            borderRadius: 28,
            backgroundColor: glassBg,
            borderWidth: 1,
            borderColor: glassBorder,
          }}
        >
          {/* Decorative brand blob (matches mockup -top-12 -right-12) */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -48,
              right: -48,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(59,130,246,0.30)',
            }}
          />

          <Text
            className="text-[11px] font-bold tracking-widest"
            style={{ color: inkSecondary }}
          >
            DETECTED AMOUNT
          </Text>

          <View className="flex-row items-baseline mt-1" style={{ gap: 4 }}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder={currency === 'INR' ? '₹0' : `${currency} 0`}
              placeholderTextColor={inkPlaceholder}
              style={{
                flex: 1,
                fontSize: 44,
                fontWeight: '800',
                color: inkPrimary,
                paddingVertical: 0,
              }}
            />
          </View>

          <Text className="text-[12px] mt-1" style={{ color: inkSecondary }}>
            {formattedAmount}
          </Text>

          {parsed.category_hint && (
            <View
              className="self-start flex-row items-center mt-3 px-2 py-1"
              style={{
                gap: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(16,185,129,0.18)',
              }}
            >
              <Ionicons name="flash" size={12} color="#10B981" />
              <Text className="text-[11px] font-bold" style={{ color: '#10B981' }}>
                AI confident · {parsed.category_hint}
              </Text>
            </View>
          )}
        </View>

        {/* Section rows */}
        <View className="mt-4" style={{ gap: 8 }}>
          {/* Merchant */}
          <View
            className="flex-row items-center p-3"
            style={{ gap: 10, borderRadius: 16, backgroundColor: rowBg }}
          >
            <Ionicons name="storefront-outline" size={18} color={inkSecondary} />
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Where was this?"
              placeholderTextColor={inkPlaceholder}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '500',
                color: inkPrimary,
                paddingVertical: 0,
              }}
            />
          </View>

          {/* Note */}
          <View
            className="flex-row items-center p-3"
            style={{ gap: 10, borderRadius: 16, backgroundColor: rowBg }}
          >
            <Ionicons name="document-text-outline" size={18} color={inkSecondary} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional note"
              placeholderTextColor={inkPlaceholder}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '500',
                color: inkPrimary,
                paddingVertical: 0,
              }}
            />
          </View>

          {/* Category */}
          <Pressable
            onPress={() => setShowCategory(true)}
            style={[
              ROW_STATIC_STYLE,
              {
                backgroundColor: rowBg,
                borderWidth: !categoryId ? 1 : 0,
                borderColor: 'rgba(239,68,68,0.45)',
              },
            ]}
          >
            <Ionicons name="pricetags-outline" size={18} color={inkSecondary} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selectedCategory ? inkPrimary : inkPlaceholder,
              }}
            >
              {selectedCategory?.label ??
                (aiBusy ? 'AI is picking a category…' : 'Pick a category')}
            </Text>
            {aiBusy ? (
              <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={inkSecondary} />
            )}
          </Pressable>

          {/* Wallet */}
          <Pressable
            onPress={() => setShowWallet(true)}
            style={[
              ROW_STATIC_STYLE,
              {
                backgroundColor: rowBg,
                borderWidth: !walletId ? 1 : 0,
                borderColor: 'rgba(239,68,68,0.45)',
              },
            ]}
          >
            <Ionicons name="card-outline" size={18} color={inkSecondary} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selectedWallet ? inkPrimary : inkPlaceholder,
              }}
            >
              {selectedWallet?.label ?? 'Pick a wallet'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={inkSecondary} />
          </Pressable>

          {/* Date */}
          <View
            className="flex-row items-center p-3"
            style={{ gap: 10, borderRadius: 16, backgroundColor: rowBg }}
          >
            <Ionicons name="calendar-outline" size={18} color={inkSecondary} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: inkPrimary,
              }}
            >
              {formatRelativeDate(occurredAt)}
            </Text>
            <Pressable onPress={() => setOccurredAt(new Date().toISOString())} hitSlop={6}>
              <Text className="text-[12px] font-semibold text-[#3B82F6]">Now</Text>
            </Pressable>
          </View>

          {/* Voice transcript echo */}
          {source === 'voice' && payload.transcript && (
            <View
              className="p-3"
              style={{
                borderRadius: 16,
                backgroundColor: glassBg,
                borderWidth: 1,
                borderColor: glassBorder,
              }}
            >
              <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
                <Ionicons name="volume-medium-outline" size={14} color="#3B82F6" />
                <Text
                  className="text-[11px] font-bold tracking-widest"
                  style={{ color: inkSecondary }}
                >
                  FROM YOUR VOICE
                </Text>
              </View>
              <Text
                className="text-[12px] italic"
                style={{ color: inkPrimary }}
              >
                "{payload.transcript}"
              </Text>
            </View>
          )}

          {currency !== baseCurrency && (
            <Pressable
              onPress={() => setCurrency(baseCurrency)}
              style={[
                CURRENCY_CHIP_STYLE,
                { backgroundColor: 'rgba(59,130,246,0.12)' },
              ]}
            >
              <Text className="text-[12px] font-semibold text-[#3B82F6]">
                Currency: {currency} → tap to use {baseCurrency}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-1" />

        {formError && (
          <Card padded={false} style={{ marginBottom: 8 }}>
            <Text className="p-3 text-[#EF4444] text-[13px] font-semibold">
              {formError}
            </Text>
          </Card>
        )}

        {/* Footer */}
        <View className="flex-row mb-4" style={{ gap: 12 }}>
          <Button variant="ghost" onPress={() => router.back()} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            onPress={handleSave}
            loading={createMutation.isPending}
            leftIcon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />}
            style={{ flex: 2 }}
          >
            Save expense
          </Button>
        </View>
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
    </Screen>
  );
}

// STATIC array-form styles — layout-bearing Pressables.
const ROW_STATIC_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  padding: 12,
  borderRadius: 16,
};

const CURRENCY_CHIP_STYLE = {
  paddingHorizontal: 12,
  paddingVertical: 8,
  alignSelf: 'flex-start' as const,
  borderRadius: 999,
};
