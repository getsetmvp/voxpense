// 06 — Sign-up. MVP design, wired to new app auth store.

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { ApiError } from '../../src/lib/api';

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Z]/.test(pw)) s += 1;
  if (/[0-9]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return s;
}

export default function SignupScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const signup = useAuth((s) => s.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);

  const score = passwordScore(password);
  const scoreLabel = score >= 3 ? 'Strong' : score === 2 ? 'OK' : 'Weak';
  const scoreColor = score >= 3 ? tokens.good : score === 2 ? tokens.warn : tokens.bad;

  const onSubmit = async () => {
    if (!agree) {
      toast.show('Please agree to the Terms', 'bad');
      return;
    }
    if (password.length < 8) {
      toast.show('Password must be at least 8 characters', 'bad');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim().toLowerCase(), password, name.trim() || undefined);
      // After signup go to currency picker, then wallet, then home.
      router.replace('/(onboarding)/currency');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message ?? 'Could not create account'
          : 'Could not create account';
      toast.show(msg, 'bad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header back />
      <View style={{ paddingHorizontal: 24, flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: tokens.ink }}>Create account</Text>
        <Text style={{ fontSize: 13, color: tokens.muted, marginTop: 4, marginBottom: 24 }}>
          30 seconds. No card needed.
        </Text>
        <View style={{ gap: 12 }}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Yash"
            autoComplete="name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          {password.length > 0 ? (
            <View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: i < score ? scoreColor : tokens.border,
                    }}
                  />
                ))}
              </View>
              <Text style={{ color: scoreColor, fontSize: 12, marginTop: 4 }}>{scoreLabel}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => setAgree((v) => !v)}
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 20,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: agree ? tokens.brand : 'transparent',
              borderWidth: agree ? 0 : 1,
              borderColor: tokens.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            {agree ? <Check size={14} color="#fff" /> : null}
          </View>
          <Text style={{ fontSize: 12, color: tokens.muted, flex: 1 }}>
            I agree to the Terms and Privacy Policy.
          </Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Button label="Create account" onPress={onSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
