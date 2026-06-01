// 04 — Onboarding Wallet. Post-currency step. Creates first wallet, seeds
// default groups (Office/Personal/Travel) + a handful of categories, lands on home.

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { CreditCard, Landmark, Smartphone, Wallet as WalletIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { Dots } from '../../src/components/layout/Dots';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { wallets, groups, categories } from '../../src/lib/endpoints';
import { useToast } from '../../src/components/ui/Toast';
import type { WalletKind } from '@voxpense/shared-types';

const KINDS: { id: WalletKind; label: string; sub: string; Icon: typeof WalletIcon }[] = [
  { id: 'cash', label: 'Cash', sub: 'Physical money', Icon: WalletIcon },
  { id: 'card', label: 'Card', sub: 'Credit / Debit', Icon: CreditCard },
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe…', Icon: Smartphone },
  { id: 'bank', label: 'Bank', sub: 'Account balance', Icon: Landmark },
];

const DEFAULT_GROUPS = [
  {
    name: 'Office',
    color: '#6366F1',
    categories: ['Fuel', 'Client lunch', 'Stationery', 'Travel', 'Subscriptions'],
  },
  {
    name: 'Personal',
    color: '#10B981',
    categories: ['Food', 'Groceries', 'Rent', 'Entertainment', 'Health'],
  },
  {
    name: 'Travel',
    color: '#F59E0B',
    categories: ['Flights', 'Stay', 'Local transport'],
  },
];

export default function WalletScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const baseCurrency = user?.baseCurrency ?? 'INR';

  const [kind, setKind] = useState<WalletKind>('cash');
  const [name, setName] = useState('Personal Cash');
  const [balance, setBalance] = useState('5000');
  const [saving, setSaving] = useState(false);

  const onContinue = async () => {
    setSaving(true);
    try {
      const existingGroups = await groups.list();
      if (existingGroups.length === 0) {
        for (const g of DEFAULT_GROUPS) {
          const created = await groups.create({ name: g.name, color: g.color });
          for (const cat of g.categories) {
            await categories.create({
              name: cat,
              groupId: created.id,
              color: g.color,
              icon: 'tag',
            });
          }
        }
      }
      await wallets.create({
        name,
        kind,
        currency: baseCurrency,
        openingBalance: String(Number(balance.replace(/[, ]/g, '')) || 0),
      });
      router.replace('/(tabs)/home');
    } catch {
      toast.show('Could not create wallet. Try again.', 'bad');
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
        <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.ink }}>Add a wallet</Text>
        <Text style={{ fontSize: 13, color: tokens.muted, marginTop: 4, marginBottom: 24 }}>
          Where the money comes from. Add more later from Settings.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KINDS.map((k) => {
            const active = kind === k.id;
            return (
              <Pressable
                key={k.id}
                onPress={() => setKind(k.id)}
                style={{
                  width: '48%',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? tokens.brand : tokens.border,
                  backgroundColor: active ? `${tokens.brand}0D` : 'transparent',
                  gap: 8,
                }}
              >
                <k.Icon size={24} color={active ? tokens.brand : tokens.ink} />
                <Text style={{ fontWeight: '600', color: tokens.ink }}>{k.label}</Text>
                <Text style={{ fontSize: 12, color: tokens.muted }}>{k.sub}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 24, gap: 16 }}>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input
            label={`Starting balance (${baseCurrency})`}
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
          />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Dots count={4} active={2} />
        <Button label="Finish setup" onPress={onContinue} loading={saving} />
      </View>
    </Screen>
  );
}
