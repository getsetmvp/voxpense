// Glass button. Variants: primary (filled brand), ghost (glass), danger.

import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { radii, shadows } from '../../theme/tokens';

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<Size, { px: number; py: number; fs: number }> = {
  sm: { px: 14, py: 8, fs: 13 },
  md: { px: 18, py: 12, fs: 15 },
  lg: { px: 24, py: 16, fs: 17 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const dims = sizeMap[size];
  const isDisabled = disabled || loading;

  const bg = (() => {
    switch (variant) {
      case 'primary':
        return scheme === 'dark' ? '#60A5FA' : '#3B82F6';
      case 'danger':
        return scheme === 'dark' ? '#F87171' : '#EF4444';
      case 'secondary':
        return scheme === 'dark' ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)';
      case 'ghost':
        return 'transparent';
    }
  })();

  const fg = (() => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return scheme === 'dark' ? '#60A5FA' : '#3B82F6';
      case 'ghost':
        return scheme === 'dark' ? '#F8FAFC' : '#0F172A';
    }
  })();

  const content = (
    <>
      {leftIcon}
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          style={{
            color: fg,
            fontWeight: '600',
            fontSize: dims.fs,
            marginHorizontal: leftIcon || rightIcon ? 6 : 0,
          }}
        >
          {children}
        </Text>
      )}
      {rightIcon}
    </>
  );

  // Android newArch + elevation can render the host view's backgroundColor as
  // transparent in certain cases (RN 0.74+ Fabric). Defensive fix: paint the
  // fill as an absolutely-positioned sibling View BEHIND the content, with
  // the same radius. The outer Pressable holds the shape + shadow only.
  const baseStyle: ViewStyle = {
    paddingHorizontal: dims.px,
    paddingVertical: dims.py,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
    backgroundColor: bg,
    overflow: 'hidden',
    ...(variant === 'primary' ? shadows.fab : {}),
  };

  const fillStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: bg,
    borderRadius: radii.pill,
  };

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        style={({ pressed }) => [
          { ...baseStyle, backgroundColor: 'transparent' },
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
          style,
        ]}
        {...rest}
      >
        <BlurView
          intensity={20}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        baseStyle,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
      {...rest}
    >
      <View pointerEvents="none" style={fillStyle} />
      {content}
    </Pressable>
  );
}
