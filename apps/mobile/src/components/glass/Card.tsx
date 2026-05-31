// Glass surface card. Tasteful Glassmorphism on Material 3 base.
// Used for: list rows, metric tiles, modals, sheets, settings groups.

import { ReactNode } from 'react';
import { View, ViewStyle, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { blur as blurTokens, radii, shadows } from '../../theme/tokens';

type Intensity = 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  intensity?: Intensity;
  rounded?: keyof typeof radii;
  padded?: boolean;
  className?: string;
  style?: ViewStyle;
}

const intensityMap: Record<Intensity, number> = {
  sm: 12,
  md: blurTokens.card,
  lg: blurTokens.sheet,
};

export function Card({
  children,
  intensity = 'md',
  rounded = 'lg',
  padded = true,
  className,
  style,
}: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const borderColor = scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  // On Android newArch, elevation needs a solid backgroundColor on the same
  // style object as the shadow tokens for the shadow + body to render
  // correctly. Set an opaque base here so the BlurView + translucent inner
  // surface composite on top of it instead of bare transparency.
  const baseBg = scheme === 'dark' ? '#0F172A' : '#FFFFFF';
  return (
    <View
      style={[
        {
          borderRadius: radii[rounded],
          overflow: 'hidden',
          borderWidth: 1,
          borderColor,
          backgroundColor: baseBg,
          ...shadows.card,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensityMap[intensity]}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={{ flex: 1 }}
      >
        <View
          className={className}
          style={{
            padding: padded ? 16 : 0,
            backgroundColor:
              scheme === 'dark' ? 'rgba(17,24,39,0.55)' : 'rgba(255,255,255,0.55)',
          }}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}
