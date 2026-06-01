import { Pressable, Text, ActivityIndicator, View, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'primary' | 'ghost' | 'danger' | 'brand';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth = true,
  onPress,
  ...rest
}: Props) {
  const { tokens } = useTheme();

  let bg: string;
  let fg: string;
  let border: string | undefined;
  switch (variant) {
    case 'primary':
      bg = tokens.ink;
      fg = tokens.inkInverse;
      break;
    case 'brand':
      bg = tokens.brand;
      fg = '#FFFFFF';
      break;
    case 'ghost':
      bg = 'transparent';
      fg = tokens.ink;
      border = tokens.border;
      break;
    case 'danger':
      bg = 'transparent';
      fg = tokens.bad;
      border = `${tokens.bad}55`;
      break;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      style={{
        height: 48,
        borderRadius: 16,
        backgroundColor: bg,
        opacity: disabled ? 0.5 : 1,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        overflow: 'hidden',
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
