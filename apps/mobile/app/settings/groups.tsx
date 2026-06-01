// Groups settings — list + inline new/edit sheet + delete confirm.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { FolderTree, Plus } from 'lucide-react-native';
import type { Group } from '@voxpense/shared-types';

import { Screen, Header } from '../../src/components/layout';
import {
  Button,
  Input,
  ListItem,
  Sheet,
  EmptyState,
  ConfirmDialog,
  Skeleton,
  useToast,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useGroups,
  useCategories,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from '../../src/queries/insights';

const SWATCHES = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316'];

interface Draft {
  id?: string;
  name: string;
  color: string;
}

function SwatchRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {SWATCHES.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c,
              borderWidth: selected ? 3 : 0,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        );
      })}
    </View>
  );
}

export default function GroupsSettings() {
  const { tokens } = useTheme();
  const toast = useToast();

  const q = useGroups();
  const cats = useCategories();
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const remove = useDeleteGroup();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const groups = q.data ?? [];

  const countByGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cats.data ?? []) {
      if (!c.groupId) continue;
      m.set(c.groupId, (m.get(c.groupId) ?? 0) + 1);
    }
    return m;
  }, [cats.data]);

  const openNew = () => setDraft({ name: '', color: SWATCHES[0] });
  const openEdit = (g: Group) => setDraft({ id: g.id, name: g.name, color: g.color });

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.show('Name required', 'bad');
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: { name: draft.name.trim(), color: draft.color },
        });
        toast.show('Group saved', 'good');
      } else {
        await create.mutateAsync({ name: draft.name.trim(), color: draft.color });
        toast.show('Group created', 'good');
      }
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', 'bad');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete);
      toast.show('Group deleted', 'good');
      setConfirmDelete(null);
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Delete failed', 'bad');
      setConfirmDelete(null);
    }
  };

  return (
    <Screen>
      <Header
        back
        title="Groups"
        right={
          <Pressable onPress={openNew} hitSlop={8}>
            <Plus size={20} color={tokens.brand} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}>
        {q.isLoading ? (
          <View style={{ gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 60, borderRadius: 16 }} />
            ))}
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<FolderTree size={28} color={tokens.brand} />}
            title="No groups yet"
            body="Groups roll up related categories — Office, Personal, Travel, etc."
            action={<Button label="Add group" variant="brand" fullWidth={false} onPress={openNew} />}
          />
        ) : (
          <View
            style={{
              backgroundColor: tokens.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: tokens.border,
              overflow: 'hidden',
            }}
          >
            {groups.map((g, i) => {
              const count = countByGroup.get(g.id) ?? 0;
              return (
                <View key={g.id}>
                  <ListItem
                    leading={
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: g.color,
                        }}
                      />
                    }
                    title={g.name}
                    trailingText={`${count} ${count === 1 ? 'cat' : 'cats'}`}
                    onPress={() => openEdit(g)}
                  />
                  {i < groups.length - 1 ? (
                    <View
                      style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={55}>
        {draft && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
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
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: tokens.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Color
              </Text>
              <SwatchRow
                value={draft.color}
                onChange={(color) => setDraft({ ...draft, color })}
              />
            </View>
            <View style={{ height: 4 }} />
            <Button
              label={draft.id ? 'Save changes' : 'Create group'}
              onPress={submit}
              loading={create.isPending || update.isPending}
            />
            {draft.id ? (
              <Button
                label="Delete group"
                variant="danger"
                onPress={() => setConfirmDelete(draft.id!)}
              />
            ) : null}
            <Button label="Cancel" variant="ghost" onPress={() => setDraft(null)} />
          </View>
        )}
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="Delete group?"
        message="Categories in this group will become ungrouped."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </Screen>
  );
}
