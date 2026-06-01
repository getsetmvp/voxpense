import { View, Text, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'default' | 'brand' | 'good' | 'warn' | 'bad' | 'solid';

type Props = ViewProps & {
  label: string;
  icon?: ReactNode;
  variant?: Variant;
};

export function Chip({ label, icon, variant = 'default', style, ...rest }: Props) {
  const { tokens } = useTheme();
  let bg: string;
  let fg: string;
  switch (variant) {
    case 'brand':
      bg = `${tokens.brand}1A`;
      fg = tokens.brand;
      break;
    case 'good':
      bg = '#10B98119';
      fg = tokens.good;
      break;
    case 'warn':
      bg = '#F59E0B19';
      fg = tokens.warn;
      break;
    case 'bad':
      bg = '#EF444419';
      fg = tokens.bad;
      break;
    case 'solid':
      bg = tokens.ink;
      fg = tokens.inkInverse;
      break;
    default:
      bg = tokens.surface;
      fg = tokens.ink;
  }
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: variant === 'default' ? 1 : 0,
          borderColor: tokens.border,
        },
        style,
      ]}
      {...rest}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '500', color: fg }}>{label}</Text>
    </View>
  );
}
