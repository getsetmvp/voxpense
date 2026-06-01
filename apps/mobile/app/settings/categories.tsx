// Categories settings — grouped list by group + inline new/edit sheet.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import {
  Tag,
  Utensils,
  Fuel,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Plane,
  Heart,
  Music,
  Gift,
  Briefcase,
  Plus,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import type { Category } from '@voxpense/shared-types';

import { Screen, Header, SectionHeader } from '../../src/components/layout';
import {
  Button,
  Input,
  Sheet,
  EmptyState,
  ConfirmDialog,
  Skeleton,
  useToast,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  useCategories,
  useGroups,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../src/queries/insights';

const SWATCHES = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316'];

const ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'tag', Icon: Tag },
  { key: 'utensils', Icon: Utensils },
  { key: 'fuel', Icon: Fuel },
  { key: 'shopping-bag', Icon: ShoppingBag },
  { key: 'coffee', Icon: Coffee },
  { key: 'home', Icon: Home },
  { key: 'car', Icon: Car },
  { key: 'plane', Icon: Plane },
  { key: 'heart', Icon: Heart },
  { key: 'music', Icon: Music },
  { key: 'gift', Icon: Gift },
  { key: 'briefcase', Icon: Briefcase },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
);

function CategoryIcon({ icon, color, size = 16 }: { icon?: string; color: string; size?: number }) {
  const Icon = (icon && ICON_MAP[icon]) || Tag;
  return <Icon size={size} color={color} />;
}

interface Draft {
  id?: string;
  name: string;
  color: string;
  icon: string;
  groupId?: string;
}

export default function CategoriesSettings() {
  const { tokens } = useTheme();
  const toast = useToast();

  const q = useCategories();
  const groupsQ = useGroups();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cats = q.data ?? [];
  const groups = groupsQ.data ?? [];

  const grouped = useMemo(() => {
    const m = new Map<string, Category[]>();
    for (const c of cats) {
      const key = c.groupId ?? '__none__';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    }
    return m;
  }, [cats]);

  const openNew = () =>
    setDraft({
      name: '',
      color: SWATCHES[0]!,
      icon: 'tag',
      groupId: groups[0]?.id,
    });

  const openEdit = (c: Category) =>
    setDraft({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon ?? 'tag',
      groupId: c.groupId ?? undefined,
    });

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
          body: {
            name: draft.name.trim(),
            color: draft.color,
            icon: draft.icon,
            groupId: draft.groupId,
          },
        });
        toast.show('Category saved', 'good');
      } else {
        await create.mutateAsync({
          name: draft.name.trim(),
          color: draft.color,
          icon: draft.icon,
          groupId: draft.groupId,
        });
        toast.show('Category created', 'good');
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
      toast.show('Category deleted', 'good');
      setConfirmDelete(null);
      setDraft(null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Delete failed', 'bad');
      setConfirmDelete(null);
    }
  };

  const sections: { id: string; name: string; color: string; items: Category[] }[] = [
    ...groups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      items: grouped.get(g.id) ?? [],
    })),
    ...(grouped.get('__none__')
      ? [
          {
            id: '__none__',
            name: 'Ungrouped',
            color: tokens.muted,
            items: grouped.get('__none__')!,
          },
        ]
      : []),
  ];

  return (
    <Screen>
      <Header
        back
        title="Categories"
        right={
          <Pressable onPress={openNew} hitSlop={8}>
            <Plus size={20} color={tokens.brand} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}>
        {q.isLoading ? (
          <View style={{ gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: 48, borderRadius: 12 }} />
            ))}
          </View>
        ) : cats.length === 0 ? (
          <EmptyState
            icon={<Tag size={28} color={tokens.brand} />}
            title="No categories yet"
            body="Categories let you tag expenses — Food, Fuel, Rent, etc."
            action={
              <Button label="Add category" variant="brand" fullWidth={false} onPress={openNew} />
            }
          />
        ) : (
          sections.map((s) =>
            s.items.length === 0 ? null : (
              <View key={s.id} style={{ gap: 4 }}>
                <SectionHeader>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: s.color,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: tokens.muted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.name}
                    </Text>
                  </View>
                </SectionHeader>
                <View
                  style={{
                    backgroundColor: tokens.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    overflow: 'hidden',
                  }}
                >
                  {s.items.map((c, i) => (
                    <View key={c.id}>
                      <Pressable
                        onPress={() => openEdit(c)}
                        android_ripple={{ color: `${tokens.ink}14` }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: `${c.color}22`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CategoryIcon icon={c.icon} color={c.color} />
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: c.color,
                            }}
                          />
                          <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.ink }}>
                            {c.name}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={tokens.muted} />
                      </Pressable>
                      {i < s.items.length - 1 ? (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: tokens.border,
                            marginLeft: 14,
                          }}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ),
          )
        )}
      </ScrollView>

      <Sheet visible={draft !== null} onClose={() => setDraft(null)} heightPct={85}>
        {draft && (
          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
              {draft.id ? 'Edit category' : 'New category'}
            </Text>
            <Input
              label="Name"
              placeholder="e.g. Coffee"
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
                  marginBottom: 8,
                }}
              >
                Group
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Pressable
                  onPress={() => setDraft({ ...draft, groupId: undefined })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: !draft.groupId ? tokens.brand : tokens.border,
                    backgroundColor: !draft.groupId ? `${tokens.brand}14` : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: !draft.groupId ? tokens.brand : tokens.ink,
                    }}
                  >
                    None
                  </Text>
                </Pressable>
                {groups.map((g) => {
                  const selected = draft.groupId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setDraft({ ...draft, groupId: g.id })}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: g.color,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: selected ? tokens.brand : tokens.ink,
                        }}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {SWATCHES.map((c) => {
                  const selected = c.toLowerCase() === draft.color.toLowerCase();
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setDraft({ ...draft, color: c })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        borderWidth: selected ? 3 : 0,
                        borderColor: '#FFFFFF',
                      }}
                    />
                  );
                })}
              </View>
            </View>

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
                Icon
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {ICON_OPTIONS.map(({ key, Icon }) => {
                  const selected = draft.icon === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setDraft({ ...draft, icon: key })}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: selected ? tokens.brand : tokens.border,
                        backgroundColor: selected ? `${tokens.brand}14` : tokens.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} color={selected ? tokens.brand : tokens.ink} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 4 }} />
            <Button
              label={draft.id ? 'Save changes' : 'Create category'}
              onPress={submit}
              loading={create.isPending || update.isPending}
            />
            {draft.id ? (
              <Button
                label="Delete category"
                variant="danger"
                onPress={() => setConfirmDelete(draft.id!)}
              />
            ) : null}
            <Button label="Cancel" variant="ghost" onPress={() => setDraft(null)} />
          </ScrollView>
        )}
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="Delete category?"
        message="Past expenses keep their data but lose this label."
        destructive
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </Screen>
  );
}
