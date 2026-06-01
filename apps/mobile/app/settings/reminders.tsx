// Reminders list — pixel-match mockup §7 screen 22 + 23 (edit sheet).
// Layout: header (back + title + plus) → bucketed list (Overdue, Today,
// Tomorrow, This week, Later) → each row card w/ avatar icon, title,
// due-time line, optional note, and ack-done circle button (overdue
// rows render w/ red-tinted background + border).

import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Reminder } from '@voxpense/shared-types';

import {
  Screen,
  Button,
  Input,
  Sheet,
  LoadingView,
  EmptyView,
} from '../../src/components/glass';
import { SegmentedControl } from '../../src/components/settings';
import {
  useCreateReminder,
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from '../../src/queries/insights';
import {
  bucketReminderDate,
  type ReminderBucketKey,
} from '../../src/lib/insights';
import { formatDate } from '../../src/lib/format';
import { shadows } from '../../src/theme/tokens';

type RepeatChoice = 'never' | 'weekly' | 'monthly';

const BUCKET_LABELS: Record<ReminderBucketKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This week',
  later: 'Later',
};

const BUCKET_ORDER: ReminderBucketKey[] = [
  'overdue',
  'today',
  'tomorrow',
  'thisWeek',
  'later',
];

interface DraftReminder {
  id?: string;
  title: string;
  body: string;
  scheduledAt: string;
  repeat: RepeatChoice;
}

const ROW_PRESSABLE_STYLE = [{ marginBottom: 0 }];
const ACK_BTN_STYLE_BASE = {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const HEADER_BTN_STYLE_BASE = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

function rruleToRepeat(rrule: string | null): RepeatChoice {
  if (!rrule) return 'never';
  if (rrule.includes('WEEKLY')) return 'weekly';
  if (rrule.includes('MONTHLY')) return 'monthly';
  return 'never';
}

function repeatToRrule(repeat: RepeatChoice): string | null {
  if (repeat === 'weekly') return 'FREQ=WEEKLY';
  if (repeat === 'monthly') return 'FREQ=MONTHLY';
  return null;
}

function overdueDuration(scheduledAt: string, now: Date = new Date()): string {
  const dt = new Date(scheduledAt).getTime();
  const diff = now.getTime() - dt;
  if (diff <= 0) return '';
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(diff / 60_000));
    return `Overdue ${mins}m`;
  }
  if (hours < 24) return `Overdue ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Overdue ${days}d`;
}

export default function RemindersScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const reminders = useReminders();
  const create = useCreateReminder();
  const update = useUpdateReminder();
  const remove = useDeleteReminder();

  const [draft, setDraft] = useState<DraftReminder | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map<ReminderBucketKey, Reminder[]>();
    for (const k of BUCKET_ORDER) groups.set(k, []);
    for (const r of reminders.data ?? []) {
      if (r.acked) continue;
      const k = bucketReminderDate(r.scheduledAt);
      groups.get(k)?.push(r);
    }
    for (const arr of groups.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }
    return groups;
  }, [reminders.data]);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const surf = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  const openEdit = (r: Reminder) => {
    setDraft({
      id: r.id,
      title: r.title,
      body: r.body ?? '',
      scheduledAt: r.scheduledAt,
      repeat: rruleToRepeat(r.rrule),
    });
  };

  const defaultDraft = (): DraftReminder => ({
    title: '',
    body: '',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    repeat: 'never',
  });

  const submit = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      Alert.alert('Missing title', 'Reminders need a title.');
      return;
    }
    try {
      const rrule = repeatToRrule(draft.repeat);
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            title: draft.title,
            body: draft.body || null,
            scheduledAt: draft.scheduledAt,
            rrule,
          },
        });
      } else {
        await create.mutateAsync({
          title: draft.title,
          body: draft.body || undefined,
          scheduledAt: draft.scheduledAt,
          rrule: rrule ?? undefined,
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const ack = async (id: string) => {
    try {
      await update.mutateAsync({ id, body: { acked: true } });
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete reminder?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id);
            setDraft(null);
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again.');
          }
        },
      },
    ]);
  };

  const allEmpty =
    !reminders.isLoading &&
    BUCKET_ORDER.every((k) => (grouped.get(k) ?? []).length === 0);

  return (
    <Screen>
      {/* Mockup header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={[HEADER_BTN_STYLE_BASE, { backgroundColor: surf }]}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={ink} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: ink }}>Reminders</Text>
        <Pressable
          onPress={() => setDraft(defaultDraft())}
          style={[HEADER_BTN_STYLE_BASE, { backgroundColor: brand }]}
          accessibilityLabel="Add reminder"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {reminders.isLoading ? (
        <LoadingView />
      ) : allEmpty ? (
        <EmptyView
          title="No reminders"
          body="Add reminders for bill due dates, future tasks, anything."
          action={{
            label: 'Add reminder',
            onPress: () => setDraft(defaultDraft()),
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          {BUCKET_ORDER.map((bucket) => {
            const items = grouped.get(bucket) ?? [];
            if (items.length === 0) return null;
            const isOverdue = bucket === 'overdue';
            return (
              <View key={bucket} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    color: isOverdue ? '#EF4444' : meta,
                    marginBottom: 8,
                    paddingTop: 4,
                  }}
                >
                  {BUCKET_LABELS[bucket]}
                </Text>
                <View style={{ gap: 10 }}>
                  {items.map((r) => {
                    const rowBg = isOverdue
                      ? isDark
                        ? 'rgba(239,68,68,0.10)'
                        : 'rgba(239,68,68,0.05)'
                      : cardBg;
                    const rowBorder = isOverdue
                      ? 'rgba(239,68,68,0.25)'
                      : cardBorder;
                    const iconBg = isOverdue
                      ? 'rgba(239,68,68,0.15)'
                      : isDark
                        ? 'rgba(96,165,250,0.18)'
                        : 'rgba(59,130,246,0.12)';
                    const iconColor = isOverdue ? '#EF4444' : brand;
                    const ackBg = isOverdue
                      ? 'rgba(239,68,68,0.12)'
                      : isDark
                        ? 'rgba(16,185,129,0.18)'
                        : 'rgba(16,185,129,0.14)';
                    const ackColor = isOverdue ? '#EF4444' : '#10B981';
                    const dueText = isOverdue
                      ? `${formatDate(r.scheduledAt, "'Today at' h:mm a")} · ${overdueDuration(r.scheduledAt)}`
                      : bucket === 'today'
                        ? formatDate(r.scheduledAt, "'Today at' h:mm a")
                        : bucket === 'tomorrow'
                          ? formatDate(r.scheduledAt, "'Tomorrow at' h:mm a")
                          : formatDate(r.scheduledAt, "EEE 'at' h:mm a");
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => openEdit(r)}
                        style={ROW_PRESSABLE_STYLE}
                        accessibilityRole="button"
                      >
                        <View
                          style={{
                            padding: 16,
                            borderRadius: 24,
                            backgroundColor: rowBg,
                            borderWidth: 1,
                            borderColor: rowBorder,
                            ...shadows.card,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 16,
                                backgroundColor: iconBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Ionicons
                                name={r.rrule ? 'repeat' : 'notifications-outline'}
                                size={20}
                                color={iconColor}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: ink,
                                }}
                                numberOfLines={1}
                              >
                                {r.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: isOverdue ? '#EF4444' : meta,
                                  fontWeight: isOverdue ? '600' : '400',
                                  marginTop: 2,
                                }}
                              >
                                {dueText}
                                {r.rrule ? ' · repeats' : ''}
                              </Text>
                              {r.body && (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: meta,
                                    marginTop: 4,
                                  }}
                                  numberOfLines={2}
                                >
                                  {r.body}
                                </Text>
                              )}
                            </View>
                            <Pressable
                              onPress={() => ack(r.id)}
                              style={[
                                ACK_BTN_STYLE_BASE,
                                { backgroundColor: ackBg },
                              ]}
                              accessibilityLabel="Mark done"
                            >
                              <Ionicons name="checkmark" size={18} color={ackColor} />
                            </Pressable>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom-right FAB — spec-mandated pattern */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', right: 24, bottom: 96 }}
        >
          <Pressable
            onPress={() => setDraft(defaultDraft())}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: brand,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.94 : 1 }],
              ...shadows.fab,
            })}
            accessibilityLabel="Add reminder"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit reminder' : 'New reminder'}
            </Text>
            <Input
              label="Title"
              placeholder="e.g. Pay credit card bill"
              value={draft.title}
              onChangeText={(title) => setDraft({ ...draft, title })}
            />
            <Input
              label="Note (optional)"
              placeholder="HDFC card · use UPI link"
              value={draft.body}
              onChangeText={(body) => setDraft({ ...draft, body })}
              multiline
            />
            <Input
              label="Scheduled at"
              placeholder="YYYY-MM-DDTHH:mm:ss"
              value={draft.scheduledAt.slice(0, 16)}
              onChangeText={(s) => {
                const parsed = new Date(s);
                if (!Number.isNaN(parsed.getTime())) {
                  setDraft({ ...draft, scheduledAt: parsed.toISOString() });
                }
              }}
              helper="Local time, e.g. 2026-06-01T10:00"
            />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 6 }}>
                Repeat
              </Text>
              <SegmentedControl
                value={draft.repeat}
                onChange={(repeat) => setDraft({ ...draft, repeat })}
                options={[
                  { label: 'Never', value: 'never' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                ]}
              />
            </View>
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: isDark
                  ? 'rgba(6,182,212,0.10)'
                  : 'rgba(6,182,212,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(6,182,212,0.25)',
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color="#06B6D4" />
              <Text style={{ flex: 1, fontSize: 12, color: ink, lineHeight: 18 }}>
                Push notification fires at{' '}
                {formatDate(draft.scheduledAt, "h:mm a 'on' d MMM yyyy")}.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {draft.id && (
                <Button variant="danger" onPress={() => confirmDelete(draft.id as string)}>
                  Delete
                </Button>
              )}
              <View style={{ flex: 1 }} />
              <Button variant="ghost" onPress={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onPress={submit} loading={create.isPending || update.isPending}>
                Save
              </Button>
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
