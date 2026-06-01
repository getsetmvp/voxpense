// 08. ExpenseDetailScreen — pixel-match mockup screen 08.
// Top: round 40 back + more.
// Hero row: 56px rounded-3xl tinted icon, amount + merchant, category chip.
// Voice-note glass card: play button + waveform + duration + italic transcript.
// Detail rows: When (calendar), Wallet (wallet swatch + name + kind),
// optional Note, AI confidence chip.
// Footer: Edit (surf-l1) + Delete (bad/10 text-bad).

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import {
  Button,
  Card,
  Input,
  LoadingView,
  Screen,
  Sheet,
} from '../../src/components/glass';
import { PickerSheet } from '../../src/components/capture/PickerSheet';
import { WaveformBars } from '../../src/components/expense/WaveformBars';
import {
  useDeleteExpense,
  useExpense,
  useUpdateExpense,
} from '../../src/queries/expenses';
import {
  useCategories,
  useGroups,
  useWallets,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';
import type { CreateExpenseBody } from '../../src/lib/endpoints';
import type { Category, Wallet } from '@voxpense/shared-types';

type Mode = 'view' | 'edit';

interface DraftState {
  amount: string;
  merchant: string;
  note: string;
  categoryId: string | null;
  walletId: string;
  groupId: string | null;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

// ── helpers ───────────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha = 0.15): string {
  const m = hex.startsWith('#') ? hex.slice(1) : hex;
  if (m.length === 3) {
    const r = parseInt(m[0]! + m[0]!, 16);
    const g = parseInt(m[1]! + m[1]!, 16);
    const b = parseInt(m[2]! + m[2]!, 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (m.length === 6) {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function resolveCategoryIcon(icon?: string | null): IoniconName {
  if (!icon) return 'ellipse-outline';
  const k = icon.toLowerCase();
  if (k.includes('food') || k.includes('utensil') || k.includes('restaurant'))
    return 'restaurant';
  if (k.includes('fuel') || k.includes('petrol') || k.includes('car')) return 'car';
  if (k.includes('grocery') || k.includes('shop') || k.includes('cart')) return 'cart';
  if (k.includes('movie') || k.includes('film') || k.includes('entertain'))
    return 'film';
  if (k.includes('coffee') || k.includes('cafe')) return 'cafe';
  if (k.includes('home') || k.includes('house')) return 'home';
  if (k.includes('health') || k.includes('medical')) return 'medkit';
  if (k.includes('travel') || k.includes('plane')) return 'airplane';
  if (k.includes('phone') || k.includes('bill')) return 'receipt';
  if (k.includes('gift')) return 'gift';
  if (k.includes('book') || k.includes('learn')) return 'book';
  if (k.includes('clothes') || k.includes('apparel')) return 'shirt';
  return 'pricetag-outline';
}

function walletKindColor(kind: Wallet['kind']): string {
  switch (kind) {
    case 'cash':
      return '#10B981';
    case 'card':
      return '#3B82F6';
    case 'upi':
      return '#8B5CF6';
    case 'bank':
      return '#F59E0B';
    default:
      return '#94A3B8';
  }
}

function splitAmount(formatted: string): { head: string; tail: string } {
  const dot = formatted.lastIndexOf('.');
  if (dot < 0) return { head: formatted, tail: '' };
  return { head: formatted.slice(0, dot), tail: formatted.slice(dot) };
}

// ── screen ────────────────────────────────────────────────────────────────

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const fallbackCurrency = user?.baseCurrency ?? 'INR';

  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const expenseQ = useExpense(id);
  const categoriesQ = useCategories();
  const walletsQ = useWallets();
  const groupsQ = useGroups();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  const [mode, setMode] = useState<Mode>('view');
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof DraftState, string>>>({});
  const [showCat, setShowCat] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!expenseQ.data || draft) return;
    setDraft({
      amount: expenseQ.data.amount,
      merchant: expenseQ.data.merchant ?? '',
      note: expenseQ.data.note ?? '',
      categoryId: expenseQ.data.categoryId,
      walletId: expenseQ.data.walletId,
      groupId: expenseQ.data.groupId,
    });
  }, [expenseQ.data, draft]);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const brand = isDark ? '#60A5FA' : '#3B82F6';
  const surfBg = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)';
  const rowBg = isDark ? 'rgba(17,24,39,0.7)' : '#FFFFFF';

  if (!id) {
    return (
      <Screen>
        <TopChrome onBack={() => router.back()} isDark={isDark} />
        <View style={{ padding: 24 }}>
          <Text style={{ color: ink }}>Missing expense id.</Text>
        </View>
      </Screen>
    );
  }
  if (expenseQ.isLoading || !expenseQ.data || !draft) {
    return (
      <Screen>
        <TopChrome onBack={() => router.back()} isDark={isDark} />
        <LoadingView label="Loading expense..." />
      </Screen>
    );
  }
  if (expenseQ.isError) {
    return (
      <Screen>
        <TopChrome onBack={() => router.back()} isDark={isDark} />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: ink }}>
            Couldn't load expense.
          </Text>
          <Button onPress={() => expenseQ.refetch()} variant="secondary">
            Try again
          </Button>
        </View>
      </Screen>
    );
  }

  const exp = expenseQ.data;
  const expId: string = id;
  const currency = exp.currency || fallbackCurrency;
  const category: Category | null = exp.categoryId
    ? (categoriesQ.data ?? []).find((c) => c.id === exp.categoryId) ?? null
    : null;
  const wallet: Wallet | null =
    (walletsQ.data ?? []).find((w) => w.id === exp.walletId) ?? null;
  const draftCategory = draft.categoryId
    ? (categoriesQ.data ?? []).find((c) => c.id === draft.categoryId) ?? null
    : null;
  const draftWallet = (walletsQ.data ?? []).find((w) => w.id === draft.walletId) ?? null;
  const draftGroup = draft.groupId
    ? (groupsQ.data ?? []).find((g) => g.id === draft.groupId) ?? null
    : null;

  const catColor = category?.color ?? brand;
  const catIcon = resolveCategoryIcon(category?.icon);
  const { head: amountHead, tail: amountTail } = splitAmount(
    formatCurrency(exp.amount, currency),
  );

  const occurredLabel = (() => {
    try {
      const d = new Date(exp.occurredAt);
      return isSameDay(d, new Date())
        ? `Today, ${format(d, 'h:mm a')}`
        : isSameDay(d, addDaysSimple(new Date(), -1))
          ? `Yesterday, ${format(d, 'h:mm a')}`
          : format(d, 'EEE d MMM, h:mm a');
    } catch {
      return exp.occurredAt;
    }
  })();

  const confidence =
    typeof exp.parseMeta?.confidence === 'number'
      ? Math.round(exp.parseMeta.confidence * 100)
      : null;
  const confidenceTone =
    confidence === null
      ? null
      : confidence >= 85
        ? { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' }
        : confidence >= 60
          ? { bg: 'rgba(245,158,11,0.15)', fg: '#F59E0B' }
          : { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };

  function validateDraft(d: DraftState): typeof errors {
    const errs: typeof errors = {};
    const num = Number(d.amount);
    if (!d.amount.trim() || !Number.isFinite(num) || num <= 0) {
      errs.amount = 'Enter a positive amount';
    }
    if (!d.walletId) errs.walletId = 'Pick a wallet';
    return errs;
  }

  async function onSave() {
    if (!draft) return;
    const errs = validateDraft(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const body: Partial<CreateExpenseBody> = {
      amount: draft.amount.trim(),
      merchant: draft.merchant.trim() || undefined,
      note: draft.note.trim() || undefined,
      categoryId: draft.categoryId ?? undefined,
      walletId: draft.walletId,
      groupId: draft.groupId ?? undefined,
    };
    try {
      await updateMut.mutateAsync({ id: expId, body });
      setMode('view');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    }
  }

  function onCancel() {
    setDraft({
      amount: exp.amount,
      merchant: exp.merchant ?? '',
      note: exp.note ?? '',
      categoryId: exp.categoryId,
      walletId: exp.walletId,
      groupId: exp.groupId,
    });
    setErrors({});
    setMode('view');
  }

  async function onDelete() {
    try {
      await deleteMut.mutateAsync(expId);
      setShowDelete(false);
      router.back();
    } catch (e) {
      setShowDelete(false);
      Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again.');
    }
  }

  return (
    <Screen>
      <TopChrome
        onBack={() => router.back()}
        isDark={isDark}
        right={
          mode === 'edit' ? (
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                detailStyles.cancelBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={{ color: meta, fontWeight: '600', fontSize: 13 }}>
                Cancel
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                /* more menu placeholder */
              }}
              accessibilityLabel="More"
              style={({ pressed }) => [
                detailStyles.roundBtn,
                {
                  backgroundColor: surfBg,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={ink} />
            </Pressable>
          )
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: icon + amount/merchant + category chip */}
        {mode === 'view' ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 24,
                backgroundColor: withAlpha(catColor, 0.16),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={catIcon} size={28} color={catColor} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: ink,
                    letterSpacing: -0.4,
                    fontVariant: ['tabular-nums'],
                  }}
                  numberOfLines={1}
                >
                  {amountHead}
                </Text>
                {amountTail ? (
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: meta,
                      marginLeft: 1,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {amountTail}
                  </Text>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, color: meta, marginTop: 2 }}
              >
                {exp.merchant || exp.note || 'Expense'}
              </Text>
            </View>
            {category ? (
              <View
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: withAlpha(catColor, 0.12),
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>
                  {category.name}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ marginTop: 8, gap: 14 }}>
            <Input
              label="Amount"
              value={draft.amount}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, amount: t } : d))}
              keyboardType="decimal-pad"
              error={errors.amount}
              leftIcon={
                <Text style={{ color: meta, fontWeight: '600', marginRight: 4 }}>
                  {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency}
                </Text>
              }
            />
            <Input
              label="Merchant"
              value={draft.merchant}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, merchant: t } : d))}
              placeholder="Optional"
            />
            <Input
              label="Note"
              value={draft.note}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, note: t } : d))}
              placeholder="Optional"
              multiline
            />
          </View>
        )}

        {/* Voice note glass card */}
        {(exp.source === 'voice' || typeof exp.parseMeta?.transcript === 'string') ? (
          <View style={{ marginTop: 20 }}>
            <Card rounded="xl">
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: meta,
                  marginBottom: 10,
                }}
              >
                {exp.source === 'voice' ? 'Voice note' : 'Source transcript'}
              </Text>
              {exp.source === 'voice' ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Play voice note"
                    onPress={() => {
                      /* playback not wired in MVP */
                    }}
                    style={({ pressed }) => [
                      detailStyles.playBtn,
                      {
                        backgroundColor: brand,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                  </Pressable>
                  <View style={{ flex: 1, height: 28, justifyContent: 'center' }}>
                    <WaveformBars />
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: meta,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    0:04
                  </Text>
                </View>
              ) : null}
              {typeof exp.parseMeta?.transcript === 'string' ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: meta,
                    lineHeight: 18,
                    marginTop: exp.source === 'voice' ? 10 : 0,
                  }}
                >
                  &ldquo;{exp.parseMeta.transcript}&rdquo;
                </Text>
              ) : null}
            </Card>
          </View>
        ) : null}

        {/* Detail rows */}
        <View style={{ marginTop: 20, gap: 12 }}>
          <DetailRow
            icon="calendar-outline"
            label={occurredLabel}
            bg={rowBg}
            ink={ink}
            meta={meta}
            isDark={isDark}
          />

          {mode === 'view' ? (
            wallet ? (
              <WalletRow wallet={wallet} bg={rowBg} ink={ink} meta={meta} isDark={isDark} />
            ) : null
          ) : (
            <SelectRow
              icon="card-outline"
              label="Wallet"
              value={draftWallet?.name ?? 'Pick a wallet'}
              placeholder={!draftWallet}
              bg={rowBg}
              ink={ink}
              meta={meta}
              isDark={isDark}
              error={errors.walletId}
              onPress={() => setShowWallet(true)}
            />
          )}

          {mode === 'edit' ? (
            <SelectRow
              icon="pricetag-outline"
              label="Category"
              value={draftCategory?.name ?? 'No category'}
              placeholder={!draftCategory}
              bg={rowBg}
              ink={ink}
              meta={meta}
              isDark={isDark}
              onPress={() => setShowCat(true)}
            />
          ) : null}

          {mode === 'edit' ? (
            <SelectRow
              icon="folder-outline"
              label="Group"
              value={draftGroup?.name ?? 'No group'}
              placeholder={!draftGroup}
              bg={rowBg}
              ink={ink}
              meta={meta}
              isDark={isDark}
              onPress={() => setShowGroup(true)}
            />
          ) : null}

          {mode === 'view' && exp.note ? (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: rowBg,
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(15,23,42,0.06)',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: meta,
                  marginBottom: 4,
                }}
              >
                Note
              </Text>
              <Text style={{ fontSize: 14, color: ink, lineHeight: 20 }}>{exp.note}</Text>
            </View>
          ) : null}

          {mode === 'view' && confidence !== null && confidenceTone ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                borderRadius: 16,
                backgroundColor: rowBg,
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(15,23,42,0.06)',
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Ionicons name="flash" size={18} color={brand} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: ink }}>
                  AI confidence
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: confidenceTone.bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: confidenceTone.fg,
                  }}
                >
                  {confidence}%
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Footer action bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          flexDirection: 'row',
          gap: 12,
          backgroundColor: isDark
            ? 'rgba(11,18,32,0.85)'
            : 'rgba(248,250,252,0.85)',
          borderTopWidth: 1,
          borderTopColor: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(15,23,42,0.06)',
        }}
      >
        {mode === 'view' ? (
          <>
            <FooterAction
              label="Edit"
              icon="create-outline"
              onPress={() => setMode('edit')}
              isDark={isDark}
              variant="surface"
            />
            <FooterAction
              label="Delete"
              icon="trash-outline"
              onPress={() => setShowDelete(true)}
              isDark={isDark}
              variant="danger"
            />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              fullWidth
              size="lg"
              onPress={onCancel}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              size="lg"
              loading={updateMut.isPending}
              onPress={onSave}
              style={{ flex: 1 }}
            >
              Save
            </Button>
          </>
        )}
      </View>

      {/* Pickers */}
      <PickerSheet
        open={showCat}
        onClose={() => setShowCat(false)}
        title="Category"
        items={[
          { id: '__none__', label: 'No category' },
          ...((categoriesQ.data ?? []).map((c) => ({
            id: c.id,
            label: c.name,
          }))),
        ]}
        selectedId={draft.categoryId ?? '__none__'}
        onSelect={(it) =>
          setDraft((d) =>
            d ? { ...d, categoryId: it.id === '__none__' ? null : it.id } : d,
          )
        }
        leftIconFor={(it) => {
          const c = (categoriesQ.data ?? []).find((cat) => cat.id === it.id);
          if (!c) return null;
          return (
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: c.color,
              }}
            />
          );
        }}
        emptyLabel="No categories yet"
      />

      <PickerSheet
        open={showWallet}
        onClose={() => setShowWallet(false)}
        title="Wallet"
        items={(walletsQ.data ?? []).map((w) => ({
          id: w.id,
          label: w.name,
          sublabel: w.kind,
        }))}
        selectedId={draft.walletId}
        onSelect={(it) => setDraft((d) => (d ? { ...d, walletId: it.id } : d))}
        emptyLabel="No wallets yet"
      />

      <PickerSheet
        open={showGroup}
        onClose={() => setShowGroup(false)}
        title="Group"
        items={[
          { id: '__none__', label: 'No group' },
          ...((groupsQ.data ?? []).map((g) => ({
            id: g.id,
            label: g.name,
          }))),
        ]}
        selectedId={draft.groupId ?? '__none__'}
        onSelect={(it) =>
          setDraft((d) =>
            d ? { ...d, groupId: it.id === '__none__' ? null : it.id } : d,
          )
        }
        leftIconFor={(it) => {
          const g = (groupsQ.data ?? []).find((grp) => grp.id === it.id);
          if (!g) return null;
          return (
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: g.color,
              }}
            />
          );
        }}
        emptyLabel="No groups yet"
      />

      {/* Delete confirm sheet */}
      <Sheet open={showDelete} onClose={() => setShowDelete(false)}>
        <View style={{ gap: 12 }}>
          <View
            style={{
              alignSelf: 'center',
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(239,68,68,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={26} color="#EF4444" />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              color: ink,
            }}
          >
            Delete this expense?
          </Text>
          <Text style={{ fontSize: 13, textAlign: 'center', color: meta }}>
            It'll be removed from your list. You can't undo this from inside the app.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button
              variant="ghost"
              fullWidth
              size="lg"
              onPress={() => setShowDelete(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="lg"
              loading={deleteMut.isPending}
              onPress={onDelete}
              style={{ flex: 1 }}
            >
              Delete
            </Button>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

// ── small helpers ────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function addDaysSimple(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

// ── sub-components ───────────────────────────────────────────────────────

function TopChrome({
  onBack,
  right,
  isDark,
}: {
  onBack: () => void;
  right?: React.ReactNode;
  isDark: boolean;
}) {
  const surfBg = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        style={({ pressed }) => [
          detailStyles.roundBtn,
          {
            backgroundColor: surfBg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={20} color={ink} />
      </Pressable>
      {right}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  bg,
  ink,
  meta,
  isDark,
}: {
  icon: IoniconName;
  label: string;
  bg: string;
  ink: string;
  meta: string;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icon} size={18} color={meta} />
        <Text style={{ fontSize: 14, fontWeight: '500', color: ink }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={meta} />
    </View>
  );
}

function WalletRow({
  wallet,
  bg,
  ink,
  meta,
  isDark,
}: {
  wallet: Wallet;
  bg: string;
  ink: string;
  meta: string;
  isDark: boolean;
}) {
  const swatch = walletKindColor(wallet.kind);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: swatch,
          }}
        />
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: ink }}>
            {wallet.name}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: meta,
              marginTop: 2,
              textTransform: 'capitalize',
            }}
          >
            {wallet.kind}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={meta} />
    </View>
  );
}

function SelectRow({
  icon,
  label,
  value,
  placeholder,
  bg,
  ink,
  meta,
  isDark,
  error,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  placeholder?: boolean;
  bg: string;
  ink: string;
  meta: string;
  isDark: boolean;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          detailStyles.selectRow,
          {
            backgroundColor: bg,
            borderColor: error
              ? '#EF4444'
              : isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(15,23,42,0.06)',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={meta} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: meta,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: placeholder ? meta : ink,
              marginTop: 2,
            }}
          >
            {value}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={meta} />
      </Pressable>
      {error ? (
        <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6, marginLeft: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function FooterAction({
  label,
  icon,
  onPress,
  isDark,
  variant,
}: {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  isDark: boolean;
  variant: 'surface' | 'danger';
}) {
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const bg =
    variant === 'danger'
      ? isDark
        ? 'rgba(248,113,113,0.18)'
        : 'rgba(239,68,68,0.10)'
      : isDark
        ? 'rgba(31,41,55,0.85)'
        : 'rgba(241,244,248,1)';
  const fg = variant === 'danger' ? (isDark ? '#F87171' : '#EF4444') : ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        detailStyles.footerAction,
        {
          backgroundColor: bg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={fg} />
      <Text style={{ color: fg, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const detailStyles = StyleSheet.create({
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  footerAction: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
