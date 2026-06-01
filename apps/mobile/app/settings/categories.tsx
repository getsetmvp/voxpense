// Categories list — grouped by group. Tap row → Sheet to rename / pick color / pick icon.
// FAB to add new.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@voxpense/shared-types';

import { Screen, Button, Input, Sheet, LoadingView, EmptyView } from '../../src/components/glass';
import {
  ColorSwatchPicker,
  FAB,
  IconPicker,
  ScreenHeader,
  SectionGroup,
} from '../../src/components/settings';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useGroups,
  useInsightsWindow,
  useUpdateCategory,
} from '../../src/queries/insights';

interface DraftCategory {
  id?: string;
  name: string;
  color: string;
  icon: string;
  groupId: string | null;
}

const DEFAULT_DRAFT: DraftCategory = {
  name: '',
  color: '#3B82F6',
  icon: 'pricetag',
  groupId: null,
};

export default function CategoriesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const cats = useCategories();
  const groups = useGroups();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  // 30-day expense window to compute per-category usage counts (mockup shows
  // "42 expenses" / "28" beside each row).
  const window = useInsightsWindow(30);

  const [draft, setDraft] = useState<DraftCategory | null>(null);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const usageByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of window.expenses) {
      if (!e.categoryId) continue;
      m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + 1);
    }
    return m;
  }, [window.expenses]);

  const grouped = useMemo(() => {
    const byGroupId = new Map<string | null, Category[]>();
    for (const c of cats.data ?? []) {
      const key = c.groupId ?? null;
      const list = byGroupId.get(key) ?? [];
      list.push(c);
      byGroupId.set(key, list);
    }
    return byGroupId;
  }, [cats.data]);

  const groupName = (gid: string | null): string => {
    if (!gid) return 'Ungrouped';
    return groups.data?.find((g) => g.id === gid)?.name ?? 'Ungrouped';
  };

  const openEdit = (c: Category) => {
    setDraft({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      groupId: c.groupId,
    });
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Alert.alert('Missing name', 'Add a category name.');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: {
            name: draft.name,
            color: draft.color,
            icon: draft.icon,
            groupId: draft.groupId,
          },
        });
      } else {
        await create.mutateAsync({
          name: draft.name,
          color: draft.color,
          icon: draft.icon,
          ...(draft.groupId ? { groupId: draft.groupId } : {}),
        });
      }
      setDraft(null);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete category?', 'Past expenses will become uncategorized.', [
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

  const allGroupKeys = Array.from(grouped.keys());

  return (
    <Screen>
      <ScreenHeader title="Categories" />
      {cats.isLoading ? (
        <LoadingView />
      ) : (cats.data ?? []).length === 0 ? (
        <EmptyView
          title="No categories yet"
          body="Categories help you understand where your money goes."
          action={{ label: 'Add category', onPress: () => setDraft({ ...DEFAULT_DRAFT }) }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          {allGroupKeys.map((gid) => {
            const list = grouped.get(gid) ?? [];
            if (list.length === 0) return null;
            return (
              <SectionGroup key={gid ?? 'ungrouped'} title={groupName(gid)}>
                {list.map((c, idx) => {
                  const usage = usageByCat.get(c.id) ?? 0;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => openEdit(c)}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderBottomWidth: idx === list.length - 1 ? 0 : 1,
                          borderBottomColor: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(15,23,42,0.06)',
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: `${c.color}26`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={(c.icon as keyof typeof Ionicons.glyphMap) || 'pricetag'}
                          size={16}
                          color={c.color}
                        />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          marginLeft: 12,
                          fontSize: 14,
                          fontWeight: '600',
                          color: ink,
                        }}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                      {usage > 0 && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: meta,
                            marginRight: 8,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {usage}
                        </Text>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={meta} />
                    </Pressable>
                  );
                })}
              </SectionGroup>
            );
          })}
        </ScrollView>
      )}
      <FAB onPress={() => setDraft({ ...DEFAULT_DRAFT })} />

      <Sheet open={draft !== null} onClose={() => setDraft(null)}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              {draft.id ? 'Edit category' : 'New category'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. Food"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
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
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 10 }}>
                Icon
              </Text>
              <ScrollView style={{ maxHeight: 180 }}>
                <IconPicker
                  value={draft.icon}
                  onChange={(icon) => setDraft({ ...draft, icon })}
                />
              </ScrollView>
            </View>
            {(groups.data ?? []).length > 0 && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: meta, marginBottom: 10 }}>
                  Group
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable
                    onPress={() => setDraft({ ...draft, groupId: null })}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor:
                        draft.groupId === null
                          ? isDark ? '#60A5FA' : '#3B82F6'
                          : isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)',
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: draft.groupId === null ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155',
                      }}
                    >
                      None
                    </Text>
                  </Pressable>
                  {(groups.data ?? []).map((g) => {
                    const selected = g.id === draft.groupId;
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setDraft({ ...draft, groupId: g.id })}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: selected
                            ? isDark ? '#60A5FA' : '#3B82F6'
                            : isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)',
                          opacity: pressed ? 0.85 : 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        })}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: g.color,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: selected ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155',
                          }}
                        >
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
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
