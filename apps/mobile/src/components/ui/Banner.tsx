import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export function Banner({
  kind = 'info',
  text,
  icon,
}: {
  kind?: 'info' | 'warn' | 'bad';
  text: string;
  icon?: ReactNode;
}) {
  const { tokens } = useTheme();
  const colorMap = {
    info: { bg: `${tokens.brand}1A`, fg: tokens.brand },
    warn: { bg: '#F59E0B19', fg: tokens.warn },
    bad: { bg: '#EF444419', fg: tokens.bad },
  };
  const c = colorMap[kind];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.bg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
      }}
    >
      {icon}
      <Text style={{ color: c.fg, fontSize: 13, fontWeight: '500', flex: 1 }}>{text}</Text>
    </View>
  );
}
