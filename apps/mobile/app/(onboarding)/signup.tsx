// 03. OnboardingAuth (sign-up side). Name (optional) + email + password + confirm.
// On success the AuthGate in app/_layout.tsx automatically replaces to /(tabs)/home.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Card, Button, Input } from '../../src/components/glass';
import { ApiError } from '../../src/lib/api';
import { useAuth } from '../../src/store/auth';
import { AuthHeader } from '../../src/components/auth/AuthHeader';
import { PasswordField } from '../../src/components/auth/PasswordField';
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

  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [passwordErr, setPasswordErr] = useState<string | undefined>();
  const [confirmErr, setConfirmErr] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

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
      setConfirmErr('Passwords don’t match');
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
      // AuthGate will redirect to /(tabs)/home.
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
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader
            title="Create your account"
            subtitle="Speak it. Track it. Make sense of your spending."
          />

          <View style={{ marginTop: 28 }}>
            <Card padded>
              <View style={{ gap: 16 }}>
                {submitError && <FormBanner message={submitError} tone="error" />}

                <Input
                  label="Name (optional)"
                  value={name}
                  onChangeText={setName}
                  placeholder="Yash"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  leftIcon={
                    <Feather
                      name="user"
                      size={16}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                  }
                />

                <Input
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
                  leftIcon={
                    <Feather
                      name="mail"
                      size={16}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                  }
                />

                <PasswordField
                  label="Password"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordErr) setPasswordErr(undefined);
                  }}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  error={passwordErr}
                  helper={passwordErr ? undefined : 'Minimum 8 characters'}
                />

                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChangeText={(v) => {
                    setConfirm(v);
                    if (confirmErr) setConfirmErr(undefined);
                  }}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  error={confirmErr}
                />

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
            </Card>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B' }}>
              Already have an account?
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/login')}
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isDark ? '#60A5FA' : '#3B82F6',
                }}
              >
                Sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
