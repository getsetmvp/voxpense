// Big tabular-numeric amount with split integer/decimal styling.
// Used in hero summary (home) + expense detail header.

import { Text, View, useColorScheme, type ViewStyle } from 'react-native';
import { formatCurrency } from '../../lib/format';

interface AmountDisplayProps {
  amount: string | number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

const sizeMap: Record<NonNullable<AmountDisplayProps['size']>, { main: number; deci: number }> = {
  sm: { main: 18, deci: 12 },
  md: { main: 26, deci: 16 },
  lg: { main: 34, deci: 20 },
  xl: { main: 44, deci: 22 },
};

export function AmountDisplay({
  amount,
  currency = 'INR',
  size = 'lg',
  align = 'left',
  style,
}: AmountDisplayProps) {
  const scheme = useColorScheme() ?? 'light';
  const ink = scheme === 'dark' ? '#F8FAFC' : '#0F172A';
  const meta = scheme === 'dark' ? '#94A3B8' : '#64748B';
  const { main, deci } = sizeMap[size];

  const formatted = formatCurrency(amount, currency);
  // Split off ".xx" tail if present (Intl never produces multi-period).
  const dotIdx = formatted.lastIndexOf('.');
  const head = dotIdx >= 0 ? formatted.slice(0, dotIdx) : formatted;
  const tail = dotIdx >= 0 ? formatted.slice(dotIdx) : '';

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'baseline',
          alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: main,
          fontWeight: '700',
          color: ink,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.5,
        }}
      >
        {head}
      </Text>
      {tail.length > 0 && (
        <Text
          style={{
            fontSize: deci,
            fontWeight: '500',
            color: meta,
            fontVariant: ['tabular-nums'],
            marginLeft: 1,
          }}
        >
          {tail}
        </Text>
      )}
    </View>
  );
}
