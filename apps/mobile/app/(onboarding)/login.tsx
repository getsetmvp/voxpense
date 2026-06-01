// 02. OnboardingAuth (sign-in side) — pixel-match mockup screen 02.
// Back btn + title + subtitle, segmented Sign in / Sign up toggle,
// flat surf-l1 email + password fields, "Forgot password?" link,
// primary submit, footer link to sign up.

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Button } from '../../src/components/glass';
import { ApiError } from '../../src/lib/api';
import { useAuth } from '../../src/store/auth';
import { AuthTopBar } from '../../src/components/auth/AuthTopBar';
import { AuthField } from '../../src/components/auth/AuthField';
import { AuthSegmented } from '../../src/components/auth/AuthSegmented';
import { FormBanner } from '../../src/components/auth/FormBanner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [passwordErr, setPasswordErr] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const brand = isDark ? '#60A5FA' : '#3B82F6';

  function validate(): boolean {
    let ok = true;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr('Enter a valid email');
      ok = false;
    } else {
      setEmailErr(undefined);
    }
    if (password.length < 8) {
      setPasswordErr('At least 8 characters');
      ok = false;
    } else {
      setPasswordErr(undefined);
    }
    return ok;
  }

  async function onSubmit() {
    setSubmitError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? 'Wrong email or password.'
            : (err.message ?? 'Could not sign in. Try again.')
          : 'Network error. Check your connection.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthTopBar
            title="Welcome back"
            subtitle="Sign in to continue tracking."
          />

          <View style={{ marginTop: 32 }}>
            <AuthSegmented
              active="signin"
              onChange={(next) => {
                if (next === 'signup') router.replace('/(onboarding)/signup');
              }}
            />
          </View>

          <View style={{ marginTop: 24, gap: 16 }}>
            {submitError ? <FormBanner message={submitError} tone="error" /> : null}

            <AuthField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (emailErr) setEmailErr(undefined);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailErr}
              leftIcon={<Feather name="mail" size={16} color={meta} />}
            />

            <View>
              <AuthField
                label="Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordErr) setPasswordErr(undefined);
                }}
                placeholder="••••••••"
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                error={passwordErr}
                leftIcon={<Feather name="lock" size={16} color={meta} />}
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPwd ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPwd((v) => !v)}
                    hitSlop={8}
                  >
                    <Feather
                      name={showPwd ? 'eye-off' : 'eye'}
                      size={16}
                      color={meta}
                    />
                  </Pressable>
                }
              />
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  /* placeholder — forgot password not in MVP */
                }}
                hitSlop={6}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                <Text style={{ color: brand, fontSize: 12, fontWeight: '500' }}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 28 }}>
            <Button
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting}
              onPress={onSubmit}
            >
              Sign in
            </Button>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: muted }}>
              Don't have an account?
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/signup')}
              hitSlop={8}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: brand }}>
                Sign up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
