// 08. ExpenseDetailScreen
// View / inline-edit / delete. Inline edits stay local until Save; pickers
// (category / wallet / group) open a glass Sheet. Delete confirms via destructive
// Sheet button → soft-delete via DELETE /expenses/:id.

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
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
import { AmountDisplay } from '../../src/components/expense';
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
import type { CreateExpenseBody } from '../../src/lib/endpoints';

type Mode = 'view' | 'edit';

interface DraftState {
  amount: string;
  merchant: string;
  note: string;
  categoryId: string | null;
  walletId: string;
  groupId: string | null;
}

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

  // Seed draft from server data once on load + whenever entering edit mode.
  useEffect(() => {
    if (!expenseQ.data) return;
    if (draft) return;
    setDraft({
      amount: expenseQ.data.amount,
      merchant: expenseQ.data.merchant ?? '',
      note: expenseQ.data.note ?? '',
      categoryId: expenseQ.data.categoryId,
      walletId: expenseQ.data.walletId,
      groupId: expenseQ.data.groupId,
    });
  }, [expenseQ.data, draft]);

  if (!id) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} isDark={isDark} />
        <View style={{ padding: 24 }}>
          <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>Missing expense id.</Text>
        </View>
      </Screen>
    );
  }

  if (expenseQ.isLoading || !expenseQ.data || !draft) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} isDark={isDark} />
        <LoadingView label="Loading expense..." />
      </Screen>
    );
  }
  if (expenseQ.isError) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} isDark={isDark} />
        <View style={{ padding: 24, gap: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          >
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
  const category = exp.categoryId
    ? (categoriesQ.data ?? []).find((c) => c.id === exp.categoryId) ?? null
    : null;
  const wallet = (walletsQ.data ?? []).find((w) => w.id === exp.walletId) ?? null;
  const group = exp.groupId
    ? (groupsQ.data ?? []).find((g) => g.id === exp.groupId) ?? null
    : null;
  const draftCategory = draft.categoryId
    ? (categoriesQ.data ?? []).find((c) => c.id === draft.categoryId) ?? null
    : null;
  const draftWallet = (walletsQ.data ?? []).find((w) => w.id === draft.walletId) ?? null;
  const draftGroup = draft.groupId
    ? (groupsQ.data ?? []).find((g) => g.id === draft.groupId) ?? null
    : null;

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  // ── validation + save ──────────────────────────────────────────────────
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

  const occurredLabel = (() => {
    try {
      return format(new Date(exp.occurredAt), 'EEE d MMM, h:mm a');
    } catch {
      return exp.occurredAt;
    }
  })();

  const confidence =
    typeof exp.parseMeta?.confidence === 'number'
      ? Math.round(exp.parseMeta.confidence * 100)
      : null;

  return (
    <Screen>
      <BackHeader
        onBack={() => router.back()}
        isDark={isDark}
        right={
          mode === 'view' ? (
            <Pressable
              onPress={() => setMode('edit')}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)',
                opacity: pressed ? 0.8 : 1,
              })}
              accessibilityLabel="Edit"
            >
              <Text
                style={{
                  color: isDark ? '#60A5FA' : '#3B82F6',
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Edit
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: meta, fontWeight: '600', fontSize: 13 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          )
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: amount + merchant + category chip */}
        {mode === 'view' ? (
          <View style={{ marginTop: 8, gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: meta,
              }}
            >
              Amount
            </Text>
            <AmountDisplay amount={exp.amount} currency={currency} size="xl" />
            {exp.merchant && (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: ink,
                  marginTop: 4,
                }}
              >
                {exp.merchant}
              </Text>
            )}
            {category && (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: 'rgba(59,130,246,0.10)',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: category.color,
                    }}
                  />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: ink }}>
                    {category.name}
                  </Text>
                </View>
              </View>
            )}
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

        {/* Voice note card (read-only) */}
        {(exp.source === 'voice' || typeof exp.parseMeta?.transcript === 'string') && (
          <View style={{ marginTop: 18 }}>
            <Card>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: meta,
                  marginBottom: 8,
                }}
              >
                {exp.source === 'voice' ? 'Voice note' : 'Source transcript'}
              </Text>
              {typeof exp.parseMeta?.transcript === 'string' && (
                <Text
                  style={{
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: meta,
                    lineHeight: 19,
                  }}
                >
                  &ldquo;{exp.parseMeta.transcript}&rdquo;
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* Details rows */}
        <View style={{ marginTop: 18, gap: 10 }}>
          <DetailRow
            icon="calendar-outline"
            label="When"
            value={occurredLabel}
            isDark={isDark}
          />

          <SelectRow
            icon="card-outline"
            label="Wallet"
            value={mode === 'edit' ? (draftWallet?.name ?? 'Pick a wallet') : (wallet?.name ?? '—')}
            placeholder={!draftWallet && mode === 'edit'}
            isDark={isDark}
            disabled={mode !== 'edit'}
            error={errors.walletId}
            onPress={() => setShowWallet(true)}
          />

          <SelectRow
            icon="pricetag-outline"
            label="Category"
            value={
              mode === 'edit'
                ? draftCategory?.name ?? 'No category'
                : category?.name ?? 'No category'
            }
            placeholder={mode === 'edit' && !draftCategory}
            isDark={isDark}
            disabled={mode !== 'edit'}
            onPress={() => setShowCat(true)}
          />

          <SelectRow
            icon="folder-outline"
            label="Group"
            value={
              mode === 'edit' ? draftGroup?.name ?? 'No group' : group?.name ?? 'No group'
            }
            placeholder={mode === 'edit' && !draftGroup}
            isDark={isDark}
            disabled={mode !== 'edit'}
            onPress={() => setShowGroup(true)}
          />

          {mode === 'view' && exp.note && (
            <View
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.7)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: meta,
                  marginBottom: 6,
                }}
              >
                Note
              </Text>
              <Text style={{ fontSize: 14, color: ink, lineHeight: 20 }}>{exp.note}</Text>
            </View>
          )}

          {confidence !== null && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.7)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons
                  name="flash"
                  size={18}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: ink }}>
                  AI confidence
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor:
                    confidence >= 85
                      ? 'rgba(16,185,129,0.15)'
                      : confidence >= 60
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(239,68,68,0.15)',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color:
                      confidence >= 85
                        ? '#10B981'
                        : confidence >= 60
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                >
                  {confidence}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer action bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
          flexDirection: 'row',
          gap: 10,
          backgroundColor: isDark ? 'rgba(11,18,32,0.85)' : 'rgba(248,250,252,0.85)',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        }}
      >
        {mode === 'view' ? (
          <>
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onPress={() => setMode('edit')}
              leftIcon={
                <Ionicons name="create-outline" size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
              }
              style={{ flex: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onPress={() => setShowDelete(true)}
              leftIcon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
              style={{ flex: 1 }}
            >
              Delete
            </Button>
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
        onSelect={(it) =>
          setDraft((d) => (d ? { ...d, walletId: it.id } : d))
        }
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

      {/* Delete confirm */}
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

function BackHeader({
  onBack,
  right,
  isDark,
}: {
  onBack: () => void;
  right?: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(255,255,255,0.7)',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="arrow-back" size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
      </Pressable>
      {right}
    </View>
  );
}

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isDark: boolean;
}

function DetailRow({ icon, label, value, isDark }: DetailRowProps) {
  const meta = isDark ? '#94A3B8' : '#64748B';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: isDark ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.7)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        gap: 12,
      }}
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
        <Text style={{ fontSize: 14, fontWeight: '600', color: ink, marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

interface SelectRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder?: boolean;
  isDark: boolean;
  disabled?: boolean;
  error?: string;
  onPress: () => void;
}

function SelectRow({
  icon,
  label,
  value,
  placeholder,
  isDark,
  disabled,
  error,
  onPress,
}: SelectRowProps) {
  const meta = isDark ? '#94A3B8' : '#64748B';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  return (
    <View>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          borderRadius: 14,
          backgroundColor: isDark ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.7)',
          borderWidth: 1,
          borderColor: error
            ? '#EF4444'
            : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.06)',
          gap: 12,
          opacity: pressed && !disabled ? 0.8 : 1,
        })}
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
              fontWeight: '600',
              color: placeholder ? meta : ink,
              marginTop: 2,
            }}
          >
            {value}
          </Text>
        </View>
        {!disabled && (
          <Ionicons name="chevron-forward" size={18} color={meta} />
        )}
      </Pressable>
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: '#EF4444',
            marginTop: 6,
            marginLeft: 6,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
