// 05 — Sign-in. MVP design, wired to new app auth store.

import { useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useRouter, Link } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { ApiError } from '../../src/lib/api';

export default function LoginScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const onSubmit = async () => {
    setErr(undefined);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message ?? 'Could not sign in' : 'Could not sign in';
      setErr(msg);
      toast.show(msg, 'bad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header back />
      <View style={{ paddingHorizontal: 24, flex: 1 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: tokens.brand,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Mic color="#fff" size={22} />
        </View>
        <Text style={{ fontSize: 28, fontWeight: '700', color: tokens.ink }}>Welcome back</Text>
        <Text
          style={{ fontSize: 13, color: tokens.muted, marginTop: 4, marginBottom: 32 }}
        >
          Sign in to sync your expenses.
        </Text>
        <View style={{ gap: 12 }}>
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
            autoComplete="password"
            errorText={err}
            placeholder="••••••••"
          />
          <Pressable
            onPress={() => {
              const subject = encodeURIComponent('Voxpense password reset request');
              const body = encodeURIComponent(
                `Hi Voxpense team,\n\nI forgot my password and need it reset.\n\nAccount email: ${email.trim() || '[please fill in your account email]'}\n\nThank you.`,
              );
              Linking.openURL(`mailto:yash.gupta.developer@gmail.com?subject=${subject}&body=${body}`);
            }}
            hitSlop={8}
            style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
          >
            <Text style={{ color: tokens.brand, fontSize: 12, fontWeight: '600' }}>
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Button label="Sign in" onPress={onSubmit} loading={loading} />
        <View
          style={{
            alignItems: 'center',
            marginTop: 16,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: tokens.muted, fontSize: 13 }}>No account? </Text>
          <Link href="/(onboarding)/signup" asChild>
            <Pressable>
              <Text style={{ color: tokens.brand, fontWeight: '600', fontSize: 13 }}>
                Create one
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
