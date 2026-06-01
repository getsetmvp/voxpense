// 02 — Onboarding Welcome. MVP design.

import { View, Text, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Dots } from '../../src/components/layout/Dots';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: `${tokens.brand}1A`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Sparkles size={38} color={tokens.brand} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: tokens.ink,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Track expenses{'\n'}by talking
        </Text>
        <Text
          style={{ fontSize: 13, color: tokens.muted, textAlign: 'center', maxWidth: 280 }}
        >
          Say it once. We catch the amount, group it, and remember it forever.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Dots count={4} active={0} />
        <Button label="Get started" onPress={() => router.push('/(onboarding)/signup')} />
        <Pressable
          onPress={() => router.push('/(onboarding)/login')}
          style={{
            height: 40,
            marginTop: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: tokens.muted }}>I already have an account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
