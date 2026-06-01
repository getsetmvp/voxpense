// 27. GroupsScreen — color-coded group list. Tap to edit (rename + color),
// FAB to add. Category count + this-month total per group.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, useColorScheme } from 'react-native';
import type { Group } from '@voxpense/shared-types';

import { Screen, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import {
  ColorSwatchPicker,
  FAB,
  ScreenHeader,
} from '../../src/components/settings';
import {
  useCategories,
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useInsightsWindow,
  useUpdateGroup,
} from '../../src/queries/insights';
import { useAuth } from '../../src/store/auth';
import { formatCurrency } from '../../src/lib/format';
import { startOfMonth } from '../../src/lib/insights';

interface DraftGroup {
  id?: string;
  name: string;
  color: string;
}

const DEFAULT_DRAFT: DraftGroup = {
  name: '',
  color: '#3B82F6',
};

export default function GroupsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const currency = user?.baseCurrency ?? 'INR';

  const groups = useGroups();
  const cats = useCategories();
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const remove = useDeleteGroup();

  // Pull a 60-day window so "this month" totals are accurate even after the
  // first of the month. useInsightsWindow itself caches against React Query.
  const window = useInsightsWindow(60);

  const [draft, setDraft] = useState<DraftGroup | null>(null);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  // Category count per group id.
  const countByGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cats.data ?? []) {
      if (!c.groupId) continue;
      m.set(c.groupId, (m.get(c.groupId) ?? 0) + 1);
    }
    return m;
  }, [cats.data]);

  // This-month totals per group id.
  const monthTotalByGroup = useMemo(() => {
    const m = new Map<string, number>();
    const monthStart = startOfMonth(new Date()).getTime();
    for (const e of window.expenses) {
      if (!e.groupId) continue;
      const t = new Date(e.occurredAt).getTime();
      if (Number.isNaN(t) || t < monthStart) continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt)) continue;
      m.set(e.groupId, (m.get(e.groupId) ?? 0) + amt);
    }
    return m;
  }, [window.expenses]);

  const openEdit = (g: Group) => {
    setDraft({ id: g.id, name: g.name, color: g.color });
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Alert.alert('Missing name', 'Add a group name.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: { name: draft.name.trim(), color: draft.color },
        });
      } else {
        await create.mutateAsync({ name: draft.name.trim(), color: draft.color });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete group?',
      'Categories in this group will become ungrouped.',
      [
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
      ],
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Groups" />
      {groups.isLoading ? (
        <LoadingView />
      ) : (groups.data ?? []).length === 0 ? (
        <EmptyView
          title="No groups yet"
          body="Groups let you roll up related categories — e.g. Office, Personal, Travel."
          action={{ label: 'Add group', onPress: () => setDraft({ ...DEFAULT_DRAFT }) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 8 }}>
          {(groups.data ?? []).map((g) => {
            const count = countByGroup.get(g.id) ?? 0;
            const total = monthTotalByGroup.get(g.id) ?? 0;
            return (
              <Pressable
                key={g.id}
                onPress={() => openEdit(g)}
                style={[
                  {
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: isDark
                      ? 'rgba(31,41,55,0.85)'
                      : 'rgba(255,255,255,0.9)',
                    borderWidth: 1,
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: g.color,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: ink,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: meta }}>
                    {count} {count === 1 ? 'category' : 'categories'}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: meta }}>
                  This month ·{' '}
                  <Text style={{ color: ink, fontWeight: '700' }}>
                    {formatCurrency(total, currency)}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <FAB onPress={() => setDraft({ ...DEFAULT_DRAFT })} />

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit group' : 'New group'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. Office"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              autoCapitalize="words"
            />
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 10 }}>
                Color
              </Text>
              <ColorSwatchPicker
                value={draft.color}
                onChange={(color) => setDraft({ ...draft, color })}
              />
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
