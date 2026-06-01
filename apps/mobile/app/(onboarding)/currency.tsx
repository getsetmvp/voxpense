// 03 — Onboarding Currency. Post-signup step. Saves baseCurrency to server.

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { CheckCircle2, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Dots } from '../../src/components/layout/Dots';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { users } from '../../src/lib/endpoints';
import { useToast } from '../../src/components/ui/Toast';
import { SEED_CURRENCIES } from '../../src/lib/currencies';

export default function CurrencyScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>(user?.baseCurrency ?? 'INR');
  const [saving, setSaving] = useState(false);

  const filtered = SEED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const onContinue = async () => {
    setSaving(true);
    try {
      await users.update({ baseCurrency: selected });
      await refreshUser();
      router.push('/(onboarding)/wallet');
    } catch {
      toast.show('Could not save currency. Try again.', 'bad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header back />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.ink }}>
          Pick your base currency
        </Text>
        <Text
          style={{ fontSize: 13, color: tokens.muted, marginTop: 4, marginBottom: 16 }}
        >
          Reports and budgets use this. Per-expense currency can differ.
        </Text>
        <View
          style={{
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: tokens.border,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: tokens.surface,
            marginBottom: 12,
          }}
        >
          <Search size={18} color={tokens.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search currency"
            placeholderTextColor={tokens.muted}
            style={{ flex: 1, color: tokens.ink, fontSize: 14 }}
          />
        </View>
        {filtered.map((c) => {
          const isActive = selected === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => setSelected(c.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: isActive ? `${tokens.brand}1A` : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: `${tokens.brand}55`,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: isActive ? `${tokens.brand}26` : tokens.surface,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: tokens.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? tokens.brand : tokens.ink,
                      fontWeight: '600',
                    }}
                  >
                    {c.symbol}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '600', color: tokens.ink }}>{c.code}</Text>
                  <Text style={{ fontSize: 12, color: tokens.muted }}>{c.name}</Text>
                </View>
              </View>
              {isActive ? <CheckCircle2 size={22} color={tokens.brand} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Dots count={4} active={1} />
        <Button label="Continue" onPress={onContinue} loading={saving} />
      </View>
    </Screen>
  );
}
