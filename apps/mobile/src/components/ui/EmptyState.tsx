import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const { tokens } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 }}>
      {icon ? (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: `${tokens.brand}1A`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink, textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text style={{ fontSize: 13, color: tokens.muted, textAlign: 'center', maxWidth: 280 }}>
          {body}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
