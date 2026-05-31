// Reminders list — grouped by relative time bucket. Mark acked, edit, delete.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Reminder } from '@voxpense/shared-types';

import { Screen, Card, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import { FAB, ScreenHeader } from '../../src/components/settings';
import {
  useCreateReminder,
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from '../../src/queries/insights';
import { bucketReminderDate, type ReminderBucketKey } from '../../src/lib/insights';
import { formatDate } from '../../src/lib/format';

const BUCKET_LABELS: Record<ReminderBucketKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This week',
  later: 'Later',
};

const BUCKET_ORDER: ReminderBucketKey[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later'];

interface DraftReminder {
  id?: string;
  title: string;
  body: string;
  scheduledAt: string;
}

export default function RemindersScreen() {
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
      arr.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return groups;
  }, [reminders.data]);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const openEdit = (r: Reminder) => {
    setDraft({
      id: r.id,
      title: r.title,
      body: r.body ?? '',
      scheduledAt: r.scheduledAt,
    });
  };

  const defaultDraft = (): DraftReminder => ({
    title: '',
    body: '',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  const submit = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      Alert.alert('Missing title', 'Reminders need a title.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            title: draft.title,
            body: draft.body || undefined,
            scheduledAt: draft.scheduledAt,
          },
        });
      } else {
        await create.mutateAsync({
          title: draft.title,
          body: draft.body || undefined,
          scheduledAt: draft.scheduledAt,
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
    !reminders.isLoading && BUCKET_ORDER.every((k) => (grouped.get(k) ?? []).length === 0);

  return (
    <Screen>
      <ScreenHeader title="Reminders" />
      {reminders.isLoading ? (
        <LoadingView />
      ) : allEmpty ? (
        <EmptyView
          title="No reminders"
          body="Add reminders for bill due dates, future tasks, anything."
          action={{ label: 'Add reminder', onPress: () => setDraft(defaultDraft()) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
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
                    letterSpacing: 0.5,
                    color: isOverdue ? '#EF4444' : meta,
                    marginBottom: 8,
                  }}
                >
                  {BUCKET_LABELS[bucket]}
                </Text>
                <View style={{ gap: 10 }}>
                  {items.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => openEdit(r)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                    >
                      <Card>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              backgroundColor: isOverdue
                                ? 'rgba(239,68,68,0.15)'
                                : isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.12)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons
                              name="alarm-outline"
                              size={20}
                              color={isOverdue ? '#EF4444' : isDark ? '#60A5FA' : '#3B82F6'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ fontSize: 15, fontWeight: '600', color: ink }}
                              numberOfLines={1}
                            >
                              {r.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: isOverdue ? '#EF4444' : meta,
                                marginTop: 2,
                              }}
                            >
                              {formatDate(r.scheduledAt, "d MMM 'at' h:mm a")}
                              {r.rrule ? ' · repeats' : ''}
                            </Text>
                            {r.body && (
                              <Text
                                style={{ fontSize: 12, color: meta, marginTop: 4 }}
                                numberOfLines={2}
                              >
                                {r.body}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => ack(r.id)}
                            style={({ pressed }) => ({
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.14)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: pressed ? 0.7 : 1,
                            })}
                            accessibilityLabel="Mark done"
                          >
                            <Ionicons name="checkmark" size={18} color="#10B981" />
                          </Pressable>
                        </View>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
      <FAB onPress={() => setDraft(defaultDraft())} />

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
              label="Scheduled at (ISO)"
              placeholder={new Date().toISOString()}
              value={draft.scheduledAt}
              onChangeText={(scheduledAt) => setDraft({ ...draft, scheduledAt })}
              helper="Format: YYYY-MM-DDTHH:mm:ss"
            />
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
