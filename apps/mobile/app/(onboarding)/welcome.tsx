// 01. OnboardingWelcome — hero intro with pulsing mic glyph + CTAs.
// Matches mockup screen 01: brand logo, value prop, primary "Get started",
// secondary "I have an account", legal footnote.

import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Button } from '../../src/components/glass';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  // Mic pulse — radial ring expanding every ~1.4s. Matches design.md § 11.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulse rings */}
          <View
            style={{
              width: 120,
              height: 120,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                width: 96,
                height: 96,
                borderRadius: 28,
                backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 28,
                backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#3B82F6',
                shadowOpacity: 0.4,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 10,
              }}
            >
              <Feather name="mic" size={44} color="#FFFFFF" />
            </View>
          </View>

          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              textAlign: 'center',
              color: isDark ? '#F8FAFC' : '#0F172A',
              letterSpacing: -0.5,
              lineHeight: 40,
            }}
          >
            Speak it.{'\n'}Saved.
          </Text>
          <Text
            style={{
              marginTop: 16,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              color: isDark ? '#94A3B8' : '#64748B',
              paddingHorizontal: 12,
            }}
          >
            Voice-first expense tracking. Say it once — AI handles the rest.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Button
            size="lg"
            fullWidth
            onPress={() => router.replace('/(onboarding)/signup')}
          >
            Get started
          </Button>
          <Button
            size="md"
            variant="ghost"
            fullWidth
            onPress={() => router.push('/(onboarding)/login')}
          >
            I already have an account
          </Button>
          <Text
            style={{
              fontSize: 11,
              textAlign: 'center',
              marginTop: 8,
              color: isDark ? '#64748B' : '#94A3B8',
              lineHeight: 16,
            }}
          >
            By continuing you agree to the Terms and Privacy.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
