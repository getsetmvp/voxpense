// Screen 11 + 13. AI Confirm — shared between voice + photo capture.
//
// Reads `payload` from URL params (JSON containing parsed expense + source),
// renders editable fields pre-filled, allows category/wallet/date overrides
// via PickerSheet, then POSTs to /expenses on save.

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
import { radii } from '../../src/theme/tokens';
import { formatRelativeDate } from '../../src/lib/format';

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

  // Editable form state, pre-filled from parsed payload.
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

  // Auto-suggest category once we have data + an amount + no chosen category.
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
        // Soft-fail — user picks manually.
      } finally {
        if (!cancelled) setAiBusy(false);
      }
    }
    void suggest();
    return () => {
      cancelled = true;
    };
    // Intentionally only on first arrival of parsed/categories — re-running on every
    // amount/merchant edit would spam the endpoint.
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
      return expensesApi.create({
        amount,
        currency,
        merchant: merchant || undefined,
        note: note || undefined,
        occurredAt,
        categoryId: categoryId ?? undefined,
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
    if (!walletId) {
      setFormError('Pick a wallet before saving.');
      return;
    }
    createMutation.mutate();
  }, [amount, walletId, createMutation]);

  if (!payload || !parsed) {
    return (
      <Screen>
        <CaptureHeader title="Confirm" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={48} color={isDark ? '#FCA5A5' : '#EF4444'} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#F8FAFC' : '#0F172A' }}>
            No parsed expense found
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center' }}>
            The previous step did not pass an expense. Start over to try again.
          </Text>
          <Button onPress={() => router.replace('/(tabs)/home')}>Back to home</Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <CaptureHeader title="Confirm expense" />

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Card padded style={{ marginTop: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.4,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            DETECTED AMOUNT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {currency === 'INR' ? '₹' : currency}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                fontSize: 40,
                fontWeight: '800',
                color: isDark ? '#F8FAFC' : '#0F172A',
                paddingVertical: 0,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Ionicons
              name={source === 'voice' ? 'mic' : 'camera'}
              size={14}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
            <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>
              From {source === 'voice' ? 'voice capture' : 'receipt photo'}
            </Text>
          </View>
        </Card>

        <View style={{ gap: 10, marginTop: 14 }}>
          <FieldRow
            icon="storefront-outline"
            isDark={isDark}
            label="Merchant"
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Where was this?"
          />

          <FieldRow
            icon="document-text-outline"
            isDark={isDark}
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
          />

          <Pressable
            onPress={() => setShowCategory(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: radii.lg,
              backgroundColor: isDark ? '#1F2937' : '#F1F4F8',
              opacity: pressed ? 0.85 : 1,
              borderWidth: !categoryId ? 1 : 0,
              borderColor: 'rgba(239,68,68,0.45)',
            })}
          >
            <Ionicons name="pricetags-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selectedCategory
                  ? isDark ? '#F8FAFC' : '#0F172A'
                  : isDark ? '#64748B' : '#94A3B8',
              }}
            >
              {selectedCategory?.label ?? (aiBusy ? 'AI is picking a category…' : 'Pick a category')}
            </Text>
            {aiBusy ? (
              <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            )}
          </Pressable>

          <Pressable
            onPress={() => setShowWallet(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: radii.lg,
              backgroundColor: isDark ? '#1F2937' : '#F1F4F8',
              opacity: pressed ? 0.85 : 1,
              borderWidth: !walletId ? 1 : 0,
              borderColor: 'rgba(239,68,68,0.45)',
            })}
          >
            <Ionicons name="card-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selectedWallet
                  ? isDark ? '#F8FAFC' : '#0F172A'
                  : isDark ? '#64748B' : '#94A3B8',
              }}
            >
              {selectedWallet?.label ?? 'Pick a wallet'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

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
            <Ionicons name="calendar-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {formatRelativeDate(occurredAt)}
            </Text>
            <Pressable
              onPress={() => setOccurredAt(new Date().toISOString())}
              hitSlop={6}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>Now</Text>
            </Pressable>
          </View>

          {currency !== baseCurrency && (
            <Pressable
              onPress={() => setCurrency(baseCurrency)}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: 'rgba(59,130,246,0.12)',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>
                Currency: {currency} → tap to use {baseCurrency}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {formError && (
          <Card padded={false} style={{ marginBottom: 8 }}>
            <Text style={{ padding: 12, color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
              {formError}
            </Text>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
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

interface FieldRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  isDark: boolean;
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
}

function FieldRow({ icon, isDark, value, onChangeText, placeholder }: FieldRowProps) {
  return (
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
      <Ionicons name={icon} size={18} color={isDark ? '#94A3B8' : '#64748B'} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          color: isDark ? '#F8FAFC' : '#0F172A',
          paddingVertical: 0,
        }}
      />
    </View>
  );
}
