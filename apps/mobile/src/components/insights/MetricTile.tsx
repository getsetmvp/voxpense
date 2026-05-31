// Metric tile — label + big numeric + optional delta chip.

import { ReactNode } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Card } from '../glass';

interface MetricTileProps {
  label: string;
  value: string;
  delta?: { value: number; isGood?: boolean } | null;
  icon?: ReactNode;
}

export function MetricTile({ label, value, delta, icon }: MetricTileProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  let chipBg = isDark ? 'rgba(100,116,139,0.18)' : 'rgba(100,116,139,0.12)';
  let chipFg = isDark ? '#94A3B8' : '#64748B';
  if (delta && delta.value !== 0) {
    const good = delta.isGood ?? delta.value < 0;
    if (good) {
      chipBg = isDark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.14)';
      chipFg = isDark ? '#34D399' : '#10B981';
    } else {
      chipBg = isDark ? 'rgba(248,113,113,0.18)' : 'rgba(239,68,68,0.14)';
      chipFg = isDark ? '#F87171' : '#EF4444';
    }
  }
  const deltaPct = delta ? Math.round(Math.abs(delta.value) * 100) : 0;
  const sign = delta && delta.value > 0 ? '↑' : delta && delta.value < 0 ? '↓' : '–';

  return (
    <Card intensity="sm">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {icon}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: isDark ? '#94A3B8' : '#64748B',
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: isDark ? '#F8FAFC' : '#0F172A',
        }}
      >
        {value}
      </Text>
      {delta && (
        <View
          style={{
            marginTop: 6,
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: chipBg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: chipFg }}>
            {sign} {deltaPct}%
          </Text>
        </View>
      )}
    </Card>
  );
}
