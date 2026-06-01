// AuthHeader — back chevron + title + subtitle row used by login / signup
// screens. Stays consistent with mockup 02 / 03.

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function AuthHeader({ title, subtitle, onBack }: AuthHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const router = useRouter();

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
            backgroundColor: isDark ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="arrow-left" size={18} color={isDark ? '#F8FAFC' : '#0F172A'} />
      </Pressable>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          marginTop: 24,
          color: isDark ? '#F8FAFC' : '#0F172A',
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            marginTop: 6,
            color: isDark ? '#94A3B8' : '#64748B',
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
