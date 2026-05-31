// Day header for grouped expense list: label on left, day total on right.

import { Text, View, useColorScheme } from 'react-native';
import { formatCurrency } from '../../lib/format';

interface ExpenseGroupHeaderProps {
  label: string;
  total: number;
  currency?: string;
}

export function ExpenseGroupHeader({
  label,
  total,
  currency = 'INR',
}: ExpenseGroupHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 4,
        marginTop: 6,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: isDark ? '#94A3B8' : '#64748B',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: isDark ? '#F8FAFC' : '#0F172A',
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatCurrency(total, currency)}
      </Text>
    </View>
  );
}
