// Segmented control — pill row, one selected.

import { View, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.seg,
              {
                backgroundColor: selected
                  ? isDark ? '#60A5FA' : '#3B82F6'
                  : isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: selected ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  seg: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexGrow: 1,
    alignItems: 'center',
  },
});
