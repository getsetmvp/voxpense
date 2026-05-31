// Settings section group — title + bordered card with NavRow children.

import { ReactNode } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Card } from '../glass';

interface SectionGroupProps {
  title?: string;
  children: ReactNode;
}

export function SectionGroup({ title, children }: SectionGroupProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View style={{ marginBottom: 20 }}>
      {title && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: isDark ? '#94A3B8' : '#64748B',
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {title}
        </Text>
      )}
      <Card padded={false} intensity="sm">
        <View>{children}</View>
      </Card>
    </View>
  );
}
