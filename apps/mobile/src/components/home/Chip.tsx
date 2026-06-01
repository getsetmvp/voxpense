// Chip — small pill used on Home for "vs yesterday" delta + week trend.
// Renders icon + label inline. Pass tone-tinted bg + fg in props.

import { Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChipProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  fg: string;
  style?: ViewStyle;
}

export function Chip({ icon, label, bg, fg, style }: ChipProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ fontSize: 11, fontWeight: '600', color: fg }}>{label}</Text>
    </View>
  );
}
