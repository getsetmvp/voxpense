// FilterSheet — MVP design. Adapted to new app's TanStack Query hooks
// (useGroups / useWallets from queries/insights).

import { View, Text, Pressable, ScrollView } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';
import { useTheme } from '../../theme/ThemeProvider';
import { useGroups, useWallets } from '../../queries/insights';
import type { ExpenseSource } from '@voxpense/shared-types';

export type ExpenseListFilter = {
  groupId?: string | null;
  walletId?: string | null;
  source?: ExpenseSource;
};

export function FilterSheet({
  visible,
  onClose,
  value,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  value: ExpenseListFilter;
  onChange: (f: ExpenseListFilter) => void;
}) {
  const { tokens } = useTheme();
  const groupsQ = useGroups();
  const walletsQ = useWallets();
  const groups = groupsQ.data ?? [];
  const wallets = walletsQ.data ?? [];

  const sectionTitle = {
    color: tokens.muted,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    letterSpacing: 0.5,
  };

  return (
    <Sheet visible={visible} onClose={onClose} heightPct={75}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: tokens.ink,
          marginBottom: 16,
        }}
      >
        Filter
      </Text>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={sectionTitle}>Group</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          <Pressable onPress={() => onChange({ ...value, groupId: null })}>
            <Chip label="Any" variant={value.groupId == null ? 'solid' : 'default'} />
          </Pressable>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => onChange({ ...value, groupId: g.id })}>
              <Chip label={g.name} variant={value.groupId === g.id ? 'brand' : 'default'} />
            </Pressable>
          ))}
        </View>

        <Text style={sectionTitle}>Wallet</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          <Pressable onPress={() => onChange({ ...value, walletId: null })}>
            <Chip label="Any" variant={value.walletId == null ? 'solid' : 'default'} />
          </Pressable>
          {wallets.map((w) => (
            <Pressable key={w.id} onPress={() => onChange({ ...value, walletId: w.id })}>
              <Chip label={w.name} variant={value.walletId === w.id ? 'brand' : 'default'} />
            </Pressable>
          ))}
        </View>

        <Text style={sectionTitle}>Source</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {(['voice', 'photo', 'manual', 'recurring'] as ExpenseSource[]).map((s) => (
            <Pressable
              key={s}
              onPress={() =>
                onChange({ ...value, source: value.source === s ? undefined : s })
              }
            >
              <Chip
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                variant={value.source === s ? 'brand' : 'default'}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Pressable
        onPress={() => {
          onChange({});
          onClose();
        }}
        style={{
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: tokens.border,
          marginTop: 12,
        }}
      >
        <Text style={{ color: tokens.ink, fontWeight: '600' }}>Clear filters</Text>
      </Pressable>
    </Sheet>
  );
}
