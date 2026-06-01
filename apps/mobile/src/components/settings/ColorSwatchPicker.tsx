// Color swatch picker — grid of preset colors w/ selection ring.

import { View, Pressable, StyleSheet } from 'react-native';

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
}

export const SWATCHES = [
  '#3B82F6', // primary blue
  '#F43F5E', // coral
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#64748B', // slate
  '#0EA5E9', // sky
  '#84CC16', // lime
  '#A855F7', // violet
];

export function ColorSwatchPicker({ value, onChange, colors = SWATCHES }: ColorSwatchPickerProps) {
  return (
    <View style={styles.grid}>
      {colors.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={({ pressed }) => [
              styles.swatch,
              {
                backgroundColor: c,
                borderWidth: selected ? 3 : 0,
                borderColor: '#FFFFFF',
                opacity: pressed ? 0.7 : 1,
                shadowColor: c,
                shadowOpacity: selected ? 0.5 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: selected ? 6 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
