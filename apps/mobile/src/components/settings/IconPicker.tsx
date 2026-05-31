// Icon picker — grid of Ionicons names. Limited curated set.

import { View, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  icons?: string[];
}

export const ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'restaurant',
  'cafe',
  'cart',
  'fast-food',
  'pizza',
  'car',
  'bus',
  'airplane',
  'train',
  'bicycle',
  'home',
  'business',
  'flash',
  'water',
  'wifi',
  'film',
  'game-controller',
  'musical-notes',
  'fitness',
  'medkit',
  'gift',
  'cash',
  'receipt',
  'card',
  'briefcase',
  'school',
  'book',
  'pricetag',
  'paw',
  'leaf',
  'shirt',
  'cut',
];

export function IconPicker({ value, onChange, icons = ICONS }: IconPickerProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {icons.map((name) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name as string)}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected
                ? isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.12)'
                : isDark ? 'rgba(31,41,55,0.6)' : 'rgba(241,244,248,0.9)',
              borderWidth: selected ? 1.5 : 0,
              borderColor: isDark ? '#60A5FA' : '#3B82F6',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={name as keyof typeof Ionicons.glyphMap}
              size={20}
              color={selected ? (isDark ? '#60A5FA' : '#3B82F6') : (isDark ? '#CBD5E1' : '#475569')}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
