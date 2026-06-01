// 03. OnboardingAuth (sign-up side) — pixel-match mockup screen 02 sign-up state.
// Same chrome as login: back btn + title + subtitle, segmented toggle,
// flat surf-l1 fields, primary submit. Adds optional name + confirm password.

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

export default function SignupScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const signup = useAuth((s) => s.signup);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [passwordErr, setPasswordErr] = useState<string | undefined>();
  const [confirmErr, setConfirmErr] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

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
    if (confirm !== password) {
      setConfirmErr('Passwords do not match');
      ok = false;
    } else {
      setConfirmErr(undefined);
    }
    return ok;
  }

  async function onSubmit() {
    setSubmitError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const trimmedName = name.trim();
      await signup(
        email.trim().toLowerCase(),
        password,
        trimmedName.length > 0 ? trimmedName : undefined,
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'An account with that email already exists.'
            : err.status === 400
              ? (err.message ?? 'Check your details and try again.')
              : (err.message ?? 'Could not create account. Try again.')
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
            title="Create your account"
            subtitle="Speak it. Track it. Make sense of your spending."
          />

          <View style={{ marginTop: 32 }}>
            <AuthSegmented
              active="signup"
              onChange={(next) => {
                if (next === 'signin') router.replace('/(onboarding)/login');
              }}
            />
          </View>

          <View style={{ marginTop: 24, gap: 16 }}>
            {submitError ? <FormBanner message={submitError} tone="error" /> : null}

            <AuthField
              label="Name (optional)"
              value={name}
              onChangeText={setName}
              placeholder="Yash"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              leftIcon={<Feather name="user" size={16} color={meta} />}
            />

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
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              error={passwordErr}
              helper={passwordErr ? undefined : 'Minimum 8 characters'}
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

            <AuthField
              label="Confirm password"
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v);
                if (confirmErr) setConfirmErr(undefined);
              }}
              placeholder="••••••••"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              error={confirmErr}
              leftIcon={<Feather name="lock" size={16} color={meta} />}
              rightSlot={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirm ? 'Hide password' : 'Show password'
                  }
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                >
                  <Feather
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={16}
                    color={meta}
                  />
                </Pressable>
              }
            />
          </View>

          <View style={{ marginTop: 28 }}>
            <Button
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting}
              onPress={onSubmit}
            >
              Create account
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
              Already have an account?
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/login')}
              hitSlop={8}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: brand }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
