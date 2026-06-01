// Generic picker bottom sheet. Wraps <Sheet> with a list of selectable items
// (category, wallet, group). Stays presentational — owners pass the items +
// onSelect callback. Optional `leftIconFor` lets callers render a colored swatch
// or icon per item (categories ship colors; wallets ship kinds).

import { ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from '../glass';
import { radii } from '../../theme/tokens';

export interface PickerItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface PickerSheetProps<T extends PickerItem> {
  open: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedId?: string | null;
  onSelect: (item: T) => void;
  leftIconFor?: (item: T) => ReactNode;
  emptyLabel?: string;
}

export function PickerSheet<T extends PickerItem>({
  open,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  leftIconFor,
  emptyLabel = 'Nothing to pick yet',
}: PickerSheetProps<T>) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <Sheet open={open} onClose={onClose}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#F8FAFC' : '#0F172A',
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {items.length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            color: isDark ? '#94A3B8' : '#64748B',
            paddingVertical: 24,
            textAlign: 'center',
          }}
        >
          {emptyLabel}
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          style={{ maxHeight: 380 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={({ pressed }) => [
                  pickerStyles.item,
                  {
                    borderRadius: radii.md,
                    backgroundColor: selected
                      ? isDark
                        ? 'rgba(59,130,246,0.18)'
                        : 'rgba(59,130,246,0.10)'
                      : isDark
                        ? 'rgba(31,41,55,0.6)'
                        : 'rgba(241,244,248,0.85)',
                    borderWidth: selected ? 1 : 0,
                    borderColor: '#3B82F6',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {leftIconFor && <View style={{ marginRight: 12 }}>{leftIconFor(item)}</View>}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.sublabel && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        color: isDark ? '#94A3B8' : '#64748B',
                      }}
                    >
                      {item.sublabel}
                    </Text>
                  )}
                </View>
                {selected && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </Sheet>
  );
}

const pickerStyles = StyleSheet.create({
  item: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
