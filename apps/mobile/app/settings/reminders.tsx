// Reminders settings — list, create, edit, delete reminders. Uses new design
// system (Screen/Header/ListItem/Card/Sheet/Button) and queries from
// src/queries/insights.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Plus, Bell, Check, Repeat } from 'lucide-react-native';
import type { Reminder } from '@voxpense/shared-types';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { Input } from '../../src/components/ui/Input';
import { Sheet } from '../../src/components/ui/Sheet';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '../../src/queries/insights';
import { formatDate } from '../../src/lib/format';

type RepeatChoice = 'never' | 'daily' | 'weekly' | 'monthly';

interface Draft {
  id?: string;
  title: string;
  body: string;
  scheduledAt: string;
  repeat: RepeatChoice;
}

const REPEAT_OPTIONS: { label: string; value: RepeatChoice }[] = [
  { label: 'Never', value: 'never' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

function rruleToRepeat(rrule: string | null): RepeatChoice {
  if (!rrule) return 'never';
  if (rrule.includes('DAILY')) return 'daily';
  if (rrule.includes('WEEKLY')) return 'weekly';
  if (rrule.includes('MONTHLY')) return 'monthly';
  return 'never';
}

function repeatToRrule(r: RepeatChoice): string | undefined {
  if (r === 'never') return undefined;
  if (r === 'daily') return 'FREQ=DAILY';
  if (r === 'weekly') return 'FREQ=WEEKLY';
  return 'FREQ=MONTHLY';
}

function defaultDraft(): Draft {
  return {
    title: '',
    body: '',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    repeat: 'never',
  };
}

export default function RemindersSettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const reminders = useReminders();
  const create = useCreateReminder();
  const update = useUpdateReminder();
  const remove = useDeleteReminder();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const arr = [...(reminders.data ?? [])];
    arr.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    return arr;
  }, [reminders.data]);

  const openNew = () => setDraft(defaultDraft());
  const openEdit = (r: Reminder) =>
    setDraft({
      id: r.id,
      title: r.title,
      body: r.body ?? '',
      scheduledAt: r.scheduledAt,
      repeat: rruleToRepeat(r.rrule),
    });

  const submit = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.show('Title required', 'bad');
      return;
    }
    const parsed = new Date(draft.scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      toast.show('Invalid date', 'bad');
      return;
    }
    try {
      const rrule = repeatToRrule(draft.repeat);
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            title: draft.title.trim(),
            body: draft.body.trim() ? draft.body.trim() : null,
            scheduledAt: parsed.toISOString(),
            rrule: rrule ?? null,
          },
        });
        toast.show('Saved', 'good');
      } else {
        await create.mutateAsync({
          title: draft.title.trim(),
          body: draft.body.trim() ? draft.body.trim() : undefined,
          scheduledAt: parsed.toISOString(),
          rrule,
        });
        toast.show('Reminder added', 'good');
      }
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  const toggleAck = async (r: Reminder) => {
    try {
      await update.mutateAsync({ id: r.id, body: { acked: !r.acked } });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Update failed', 'bad');
    }
  };

  const onDelete = async () => {
    if (!confirmId) return;
    try {
      await remove.mutateAsync(confirmId);
      setConfirmId(null);
      setDraft(null);
      toast.show('Deleted', 'good');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Delete failed', 'bad');
    }
  };

  return (
    <Screen>
      <Header
        back
        title="Reminders"
        right={
          <Pressable
            onPress={openNew}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: tokens.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="New reminder"
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 8 }}>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} color={tokens.brand} />}
            title="No reminders"
            body="Add reminders for bill due dates, future tasks, anything."
            action={<Button label="Add reminder" variant="brand" onPress={openNew} />}
          />
        ) : (
          sorted.map((r) => {
            const overdue =
              !r.acked && new Date(r.scheduledAt).getTime() < Date.now();
            return (
              <Pressable
                key={r.id}
                onPress={() => openEdit(r)}
                style={{
                  borderRadius: 16,
                  backgroundColor: tokens.surface,
                  borderWidth: 1,
                  borderColor: overdue ? `${tokens.bad}55` : tokens.border,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: r.acked ? 0.6 : 1,
                }}
              >
                <Pressable
                  onPress={() => toggleAck(r)}
                  hitSlop={8}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: r.acked ? tokens.good : tokens.border,
                    backgroundColor: r.acked ? tokens.good : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  accessibilityLabel={r.acked ? 'Mark not done' : 'Mark done'}
                >
                  {r.acked ? <Check size={16} color="#fff" /> : null}
                </Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: tokens.ink,
                      textDecorationLine: r.acked ? 'line-through' : 'none',
                    }}
                    numberOfLines={1}
                  >
                    {r.title}
                  </Text>
                  {r.body ? (
                    <Text
                      style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}
                      numberOfLines={2}
                    >
                      {r.body}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '500',
                        color: overdue ? tokens.bad : tokens.muted,
                      }}
                    >
                      {formatDate(r.scheduledAt, 'd MMM, h:mm a')}
                    </Text>
                    {r.rrule ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Repeat size={11} color={tokens.muted} />
                        <Text style={{ fontSize: 11, color: tokens.muted }}>
                          repeats
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={78}>
        {draft ? (
          <ScrollView
            contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
              {draft.id ? 'Edit reminder' : 'New reminder'}
            </Text>
            <Input
              label="Title"
              placeholder="e.g. Pay credit card bill"
              value={draft.title}
              onChangeText={(t) => setDraft({ ...draft, title: t })}
            />
            <Input
              label="Note (optional)"
              placeholder="HDFC card · use UPI link"
              value={draft.body}
              onChangeText={(t) => setDraft({ ...draft, body: t })}
              multiline
              style={{ height: 80, paddingTop: 12, textAlignVertical: 'top' }}
            />
            <Input
              label="When (ISO datetime)"
              placeholder="2026-06-01T10:00:00"
              autoCapitalize="none"
              value={draft.scheduledAt.slice(0, 16)}
              onChangeText={(s) => setDraft({ ...draft, scheduledAt: s })}
            />
            <Text style={{ fontSize: 11, color: tokens.muted, marginTop: -4 }}>
              Will fire at{' '}
              {(() => {
                const d = new Date(draft.scheduledAt);
                return Number.isNaN(d.getTime())
                  ? '—'
                  : formatDate(draft.scheduledAt, "h:mm a 'on' d MMM yyyy");
              })()}
            </Text>

            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: tokens.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Repeat
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {REPEAT_OPTIONS.map((opt) => {
                  const active = draft.repeat === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDraft({ ...draft, repeat: opt.value })}
                    >
                      <Chip
                        label={opt.label}
                        variant={active ? 'brand' : 'default'}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {draft.id ? (
                <View style={{ flex: 1 }}>
                  <Button
                    label="Delete"
                    variant="danger"
                    onPress={() => setConfirmId(draft.id!)}
                  />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Button
                  label="Save"
                  variant="brand"
                  loading={create.isPending || update.isPending}
                  onPress={submit}
                />
              </View>
            </View>
          </ScrollView>
        ) : null}
      </Sheet>

      <ConfirmDialog
        visible={confirmId !== null}
        title="Delete reminder?"
        message="This cannot be undone."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </Screen>
  );
}
