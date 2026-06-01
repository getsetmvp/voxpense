import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: tokens.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Text>
      {right}
    </View>
  );
}
