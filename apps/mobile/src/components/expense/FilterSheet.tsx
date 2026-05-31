// Filter sheet — date-range preset + single category + single wallet + single group chips.
// Server endpoint takes one id per dimension, so multi-select would need a contract
// change; documented as deferred (see screen file comments).

import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { Category, Group, Wallet } from '@voxpense/shared-types';
import { Button, Sheet } from '../glass';
import { DATE_PRESETS, type DateRangePreset } from '../../hooks/useDateRange';

export interface FilterValues {
  preset: DateRangePreset;
  categoryId: string | null;
  walletId: string | null;
  groupId: string | null;
}

export const emptyFilters: FilterValues = {
  preset: 'all',
  categoryId: null,
  walletId: null,
  groupId: null,
};

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  initial: FilterValues;
  onApply: (next: FilterValues) => void;
  categories: Category[];
  wallets: Wallet[];
  groups: Group[];
}

export function FilterSheet({
  open,
  onClose,
  initial,
  onApply,
  categories,
  wallets,
  groups,
}: FilterSheetProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  const [draft, setDraft] = useState<FilterValues>(initial);

  // Reset draft each time the sheet (re)opens with new initial state.
  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const SectionTitle = ({ children }: { children: string }) => (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: meta,
        marginTop: 16,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );

  function Chip({
    selected,
    label,
    onPress,
    swatch,
  }: {
    selected: boolean;
    label: string;
    onPress: () => void;
    swatch?: string;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 7,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: selected
            ? brand
            : isDark
              ? 'rgba(31,41,55,0.7)'
              : 'rgba(241,244,248,0.9)',
          borderWidth: 1,
          borderColor: selected
            ? brand
            : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.06)',
          opacity: pressed ? 0.85 : 1,
          gap: 6,
          marginRight: 8,
          marginBottom: 8,
        })}
      >
        {swatch && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: swatch,
            }}
          />
        )}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: selected ? '#FFFFFF' : ink,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  const isDirty =
    draft.preset !== emptyFilters.preset ||
    draft.categoryId !== null ||
    draft.walletId !== null ||
    draft.groupId !== null;

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>Filter</Text>
        <Pressable onPress={() => setDraft(emptyFilters)} accessibilityRole="button">
          <Text
            style={{
              color: isDirty ? brand : meta,
              fontWeight: '600',
              fontSize: 13,
              opacity: isDirty ? 1 : 0.5,
            }}
          >
            Clear
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
        <SectionTitle>Period</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DATE_PRESETS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              selected={draft.preset === p.id}
              onPress={() => setDraft((d) => ({ ...d, preset: p.id }))}
            />
          ))}
        </View>

        <SectionTitle>Category</SectionTitle>
        {categories.length === 0 ? (
          <Text style={{ color: meta, fontSize: 13 }}>No categories yet.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip
              label="Any"
              selected={draft.categoryId === null}
              onPress={() => setDraft((d) => ({ ...d, categoryId: null }))}
            />
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                swatch={c.color}
                selected={draft.categoryId === c.id}
                onPress={() => setDraft((d) => ({ ...d, categoryId: c.id }))}
              />
            ))}
          </View>
        )}

        <SectionTitle>Wallet</SectionTitle>
        {wallets.length === 0 ? (
          <Text style={{ color: meta, fontSize: 13 }}>No wallets yet.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip
              label="Any"
              selected={draft.walletId === null}
              onPress={() => setDraft((d) => ({ ...d, walletId: null }))}
            />
            {wallets.map((w) => (
              <Chip
                key={w.id}
                label={w.name}
                selected={draft.walletId === w.id}
                onPress={() => setDraft((d) => ({ ...d, walletId: w.id }))}
              />
            ))}
          </View>
        )}

        <SectionTitle>Group</SectionTitle>
        {groups.length === 0 ? (
          <Text style={{ color: meta, fontSize: 13 }}>No groups yet.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip
              label="Any"
              selected={draft.groupId === null}
              onPress={() => setDraft((d) => ({ ...d, groupId: null }))}
            />
            {groups.map((g) => (
              <Chip
                key={g.id}
                label={g.name}
                swatch={g.color}
                selected={draft.groupId === g.id}
                onPress={() => setDraft((d) => ({ ...d, groupId: g.id }))}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ marginTop: 18 }}>
        <Button
          fullWidth
          size="lg"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        >
          Apply
        </Button>
      </View>
    </Sheet>
  );
}
