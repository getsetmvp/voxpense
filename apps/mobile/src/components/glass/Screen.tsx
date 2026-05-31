// Screen wrapper. Background gradient/blur tint + safe-area handling.
// Every top-level screen should render its content inside <Screen>.

import { ReactNode } from 'react';
import { View, ViewStyle, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  safe?: boolean;
  contentClassName?: string;
  style?: ViewStyle;
}

export function Screen({ children, safe = true, contentClassName, style }: ScreenProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors =
    scheme === 'dark'
      ? ['#0A0F1A', '#0B1220', '#0F172A']
      : ['#F8FAFC', '#EEF2F7', '#F8FAFC'];
  const Container = safe ? SafeAreaView : View;
  return (
    <View style={[{ flex: 1, backgroundColor: scheme === 'dark' ? palette.bgDark : palette.bgLight }, style]}>
      <LinearGradient colors={colors as [string, string, string]} style={{ position: 'absolute', inset: 0 }} />
      <Container style={{ flex: 1 }}>
        <View className={contentClassName ?? 'flex-1'}>{children}</View>
      </Container>
    </View>
  );
}
