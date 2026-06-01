// 01. OnboardingWelcome — pixel-match mockup screen 01.
// Hero mic glyph with pulse ring, gradient blobs in corners, brand title,
// primary "Get started" + ghost "I have an account" + legal footnote.

import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Button } from '../../src/components/glass';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  // Pulse ring (matches mockup `.ring-pulse`).
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  return (
    <Screen>
      {/* Decorative gradient blobs (top-right brand, bottom-left accent) */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: 'rgba(59,130,246,0.30)',
          opacity: isDark ? 0.55 : 1,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -80,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: 'rgba(244,63,94,0.30)',
          opacity: isDark ? 0.55 : 1,
        }}
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingBottom: 32,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -32,
          }}
        >
          {/* Mic glyph w/ pulse ring */}
          <View
            style={{
              width: 96,
              height: 96,
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
                borderRadius: 24,
                backgroundColor: brand,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: brand,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#3B82F6',
                shadowOpacity: 0.4,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 10,
              }}
            >
              <Feather name="mic" size={48} color="#FFFFFF" />
            </View>
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              textAlign: 'center',
              color: ink,
              letterSpacing: -0.6,
              lineHeight: 36,
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
              color: meta,
              paddingHorizontal: 8,
            }}
          >
            Voice-first expense tracking. Say it once — AI handles the rest.
          </Text>
        </View>

        {/* CTAs */}
        <View>
          <Button
            size="lg"
            fullWidth
            onPress={() => router.push('/(onboarding)/signup')}
          >
            Get started
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(onboarding)/login')}
            style={({ pressed }) => [
              welcomeStyles.loginBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color: ink, fontSize: 14, fontWeight: '500' }}>
              I have an account
            </Text>
          </Pressable>
          <Text
            style={{
              fontSize: 11,
              textAlign: 'center',
              marginTop: 24,
              color: muted,
              lineHeight: 16,
            }}
          >
            By continuing you agree to the{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Terms</Text> and{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Privacy</Text>.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const welcomeStyles = StyleSheet.create({
  loginBtn: {
    marginTop: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
