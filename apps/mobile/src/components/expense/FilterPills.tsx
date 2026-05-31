// Horizontal active-filter pills with dismiss-x.
// Renders nothing when no filters are active.

import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterPill {
  key: string; // unique key (also used as a11y label)
  label: string;
  onRemove: () => void;
}

interface FilterPillsProps {
  pills: FilterPill[];
}

export function FilterPills({ pills }: FilterPillsProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  if (pills.length === 0) return null;
  const brand = isDark ? '#60A5FA' : '#3B82F6';
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
    >
      {pills.map((pill) => (
        <Pressable
          key={pill.key}
          onPress={pill.onRemove}
          accessibilityLabel={`Remove filter ${pill.label}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingLeft: 12,
            paddingRight: 8,
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(96,165,250,0.4)' : 'rgba(59,130,246,0.25)',
            opacity: pressed ? 0.7 : 1,
            gap: 6,
          })}
        >
          <Text
            numberOfLines={1}
            style={{ color: brand, fontSize: 12, fontWeight: '600' }}
          >
            {pill.label}
          </Text>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.18)',
            }}
          >
            <Ionicons name="close" size={11} color={brand} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
