import { View, Text, Pressable, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

type Props = PressableProps & {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  trailingText?: string;
};

export function ListItem({ leading, title, subtitle, trailing, trailingText, ...rest }: Props) {
  const { tokens } = useTheme();
  return (
    <Pressable
      android_ripple={{ color: `${tokens.ink}14` }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
      {...rest}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.ink }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailingText ? (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: tokens.ink,
            fontVariant: ['tabular-nums'],
          }}
        >
          {trailingText}
        </Text>
      ) : null}
      {trailing}
    </Pressable>
  );
}
