import { Text, View, type TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { splitMoney } from '../../lib/money';

export function Amount({
  value,
  currency,
  size = 16,
  weight = '600',
  mutedDecimals = false,
  color,
  mutedColor,
}: {
  value: number;
  currency: string;
  size?: number;
  weight?: TextStyle['fontWeight'];
  mutedDecimals?: boolean;
  color?: string;
  mutedColor?: string;
}) {
  const { tokens } = useTheme();
  const { whole, decimals, symbol } = splitMoney(value, currency);
  const mainColor = color ?? tokens.ink;
  const subColor = mutedColor ?? (mutedDecimals ? tokens.muted : mainColor);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text
        style={{
          color: mainColor,
          fontSize: size,
          fontWeight: weight,
          fontVariant: ['tabular-nums'],
        }}
      >
        {symbol} {whole}
      </Text>
      {decimals ? (
        <Text
          style={{
            color: subColor,
            fontSize: Math.max(size - 4, 12),
            fontWeight: weight,
            fontVariant: ['tabular-nums'],
          }}
        >
          .{decimals}
        </Text>
      ) : null}
    </View>
  );
}
