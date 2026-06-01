// Expense detail + edit screen — mockup 13.
// Editable: amount, merchant, note, group, wallet, occurredAt.
// Save → useUpdateExpense. Delete → useDeleteExpense + router.back().

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Calendar, Sparkles, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Amount } from '../../src/components/ui/Amount';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Input } from '../../src/components/ui/Input';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useDeleteExpense,
  useExpense,
  useUpdateExpense,
} from '../../src/queries/expenses';
import {
  useGroups,
  useWallets,
} from '../../src/queries/insights';
import { formatDate, formatTime } from '../../src/lib/format';

type Draft = {
  amount: string;
  merchant: string;
  note: string;
  groupId: string | null;
  walletId: string;
  occurredAt: string; // ISO
};

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const expenseQ = useExpense(id);
  const groupsQ = useGroups();
  const walletsQ = useWallets();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  const groups = groupsQ.data ?? [];
  const wallets = walletsQ.data ?? [];

  const [draft, setDraft] = useState<Draft | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const e = expenseQ.data;
    if (!e) return;
    setDraft({
      amount: e.amount,
      merchant: e.merchant ?? '',
      note: e.note ?? '',
      groupId: e.groupId ?? null,
      walletId: e.walletId,
      occurredAt: e.occurredAt,
    });
  }, [expenseQ.data]);

  const expense = expenseQ.data;
  const confidence = expense?.parseMeta?.confidence;
  const numericAmount = useMemo(() => {
    const n = Number(draft?.amount ?? '0');
    return Number.isFinite(n) ? n : 0;
  }, [draft?.amount]);

  if (expenseQ.isLoading || !draft) {
    return (
      <Screen>
        <Header back title="Expense" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.brand} />
        </View>
      </Screen>
    );
  }

  if (expenseQ.isError || !expense) {
    return (
      <Screen>
        <Header back title="Expense" />
        <View style={{ padding: 24 }}>
          <Text style={{ color: tokens.muted }}>
            Couldn&rsquo;t load this expense.
          </Text>
        </View>
      </Screen>
    );
  }

  const onSave = () => {
    updateMut.mutate(
      {
        id: expense.id,
        body: {
          amount: draft.amount,
          merchant: draft.merchant.trim() || undefined,
          note: draft.note.trim() || undefined,
          groupId: draft.groupId ?? undefined,
          walletId: draft.walletId,
          occurredAt: draft.occurredAt,
        },
      },
      {
        onSuccess: () => {
          toast.show('Saved', 'good');
        },
        onError: (err) => {
          toast.show(err.message ?? 'Save failed', 'bad');
        },
      },
    );
  };

  const onDelete = () => {
    deleteMut.mutate(expense.id, {
      onSuccess: () => {
        toast.show('Deleted', 'good');
        router.back();
      },
      onError: (err) => {
        toast.show(err.message ?? 'Delete failed', 'bad');
      },
    });
  };

  const showSource =
    expense.source === 'voice'
      ? 'Voice'
      : expense.source === 'photo'
        ? 'Photo'
        : expense.source === 'recurring'
          ? 'Recurring'
          : 'Manual';

  return (
    <Screen>
      <Header
        back
        title="Expense"
        right={
          <Pressable
            onPress={() => setConfirmOpen(true)}
            accessibilityLabel="Delete expense"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={20} color={tokens.bad} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Big amount + merchant */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Amount
            value={numericAmount}
            currency={expense.currency}
            size={40}
            weight="700"
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: tokens.ink,
              marginTop: 8,
            }}
            numberOfLines={1}
          >
            {draft.merchant.trim() || expense.merchant || 'Untitled'}
          </Text>
          <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>
            {formatDate(draft.occurredAt)} · {formatTime(draft.occurredAt)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            <Chip label={showSource} />
            {typeof confidence === 'number' ? (
              <Chip
                label={`AI ${Math.round(confidence * 100)}%`}
                variant={confidence >= 0.7 ? 'good' : 'warn'}
                icon={
                  <Sparkles
                    size={10}
                    color={confidence >= 0.7 ? tokens.good : tokens.warn}
                  />
                }
              />
            ) : null}
          </View>
        </View>

        {/* Amount input */}
        <Input
          label="Amount"
          keyboardType="decimal-pad"
          value={draft.amount}
          onChangeText={(t) => setDraft({ ...draft, amount: t })}
        />

        {/* Merchant input */}
        <Input
          label="Merchant"
          value={draft.merchant}
          onChangeText={(t) => setDraft({ ...draft, merchant: t })}
          placeholder="Where you spent"
        />

        {/* Note input */}
        <Input
          label="Note"
          value={draft.note}
          onChangeText={(t) => setDraft({ ...draft, note: t })}
          placeholder="Optional"
          multiline
          numberOfLines={3}
          style={{ height: 80, paddingTop: 12, textAlignVertical: 'top' }}
        />

        {/* Group picker */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: tokens.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Group
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Pressable onPress={() => setDraft({ ...draft, groupId: null })}>
              <Chip
                label="None"
                variant={draft.groupId == null ? 'solid' : 'default'}
              />
            </Pressable>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setDraft({ ...draft, groupId: g.id })}
              >
                <Chip
                  label={g.name}
                  variant={draft.groupId === g.id ? 'brand' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Wallet picker */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: tokens.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Wallet
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setDraft({ ...draft, walletId: w.id })}
              >
                <Chip
                  label={w.name}
                  variant={draft.walletId === w.id ? 'brand' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date pill */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: tokens.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            When
          </Text>
          <Pressable
            onPress={() => setDatePickerOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 48,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
            }}
          >
            <Calendar size={16} color={tokens.muted} />
            <Text style={{ color: tokens.ink, fontSize: 14 }}>
              {formatDate(draft.occurredAt)} · {formatTime(draft.occurredAt)}
            </Text>
          </Pressable>
          {datePickerOpen ? (
            <DateTimePicker
              value={new Date(draft.occurredAt)}
              mode="datetime"
              onChange={(_, d) => {
                if (Platform.OS !== 'ios') setDatePickerOpen(false);
                if (d) setDraft({ ...draft, occurredAt: d.toISOString() });
              }}
            />
          ) : null}
        </View>

        {/* Save button */}
        <View style={{ marginTop: 12 }}>
          <Button
            label="Save changes"
            variant="brand"
            loading={updateMut.isPending}
            onPress={onSave}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmOpen}
        title="Delete this expense?"
        message="This cannot be undone."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
      />
    </Screen>
  );
}
