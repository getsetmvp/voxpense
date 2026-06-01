// AuthTopBar — small back chevron + title + subtitle stack used by login/signup.
// Matches mockup 02/03 chrome: round 36px back button, no card chrome.

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AuthTopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function AuthTopBar({ title, subtitle, onBack }: AuthTopBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const router = useRouter();
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/welcome');
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        style={({ pressed }) => [
          styles.backBtn,
          {
            backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.95)',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="arrow-left" size={18} color={ink} />
      </Pressable>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          marginTop: 24,
          color: ink,
          letterSpacing: -0.4,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 14,
            marginTop: 4,
            color: meta,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
