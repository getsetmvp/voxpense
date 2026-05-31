// Settings nav row — icon + label + optional badge + chevron.

import { ReactNode } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavRowProps {
  icon: ReactNode;
  label: string;
  hint?: string;
  badge?: string | number;
  onPress?: () => void;
  rightAccessory?: ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

export function NavRow({
  icon,
  label,
  hint,
  badge,
  onPress,
  rightAccessory,
  destructive,
  showChevron = true,
  isLast,
}: NavRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const fg = destructive
    ? isDark ? '#F87171' : '#EF4444'
    : isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: borderColor,
        backgroundColor: pressed && onPress ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)') : 'transparent',
      })}
    >
      {/* Leading icon (fixed width, never shrinks) */}
      <View style={{ width: 28, alignItems: 'center', flexShrink: 0 }}>{icon}</View>

      {/* Label (grows to push trailing items to the right edge) */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: fg }} numberOfLines={1}>
          {label}
        </Text>
        {hint && (
          <Text style={{ fontSize: 12, color: meta, marginTop: 2 }} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>

      {/* Trailing cluster: count badge + accessory + chevron, all right-aligned */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {badge != null && (
          <Text style={{ fontSize: 13, color: meta }}>{badge}</Text>
        )}
        {rightAccessory}
        {showChevron && onPress && !rightAccessory && (
          <Ionicons name="chevron-forward" size={18} color={meta} />
        )}
      </View>
    </Pressable>
  );
}
