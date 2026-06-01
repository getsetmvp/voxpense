// Preferences screen — theme, base currency, voice toggles. Patches via users.update.

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, useColorScheme } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

import { Screen, Sheet } from '../../src/components/glass';
import {
  NavRow,
  ScreenHeader,
  SectionGroup,
  SegmentedControl,
  Toggle,
} from '../../src/components/settings';
import { users } from '../../src/lib/endpoints';
import { useAuth } from '../../src/store/auth';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

export default function PreferencesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);
  const setUser = useAuth((s) => s.setUser);

  const [saving, setSaving] = useState(false);
  const [pickingCurrency, setPickingCurrency] = useState(false);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#CBD5E1' : '#334155';

  const patch = async (body: Parameters<typeof users.update>[0]) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await users.update(body);
      setUser(updated);
      await refreshUser();
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Preferences" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Preferences" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <SectionGroup title="Appearance">
          <View
            style={{
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(15,23,42,0.06)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="color-palette-outline" size={20} color={iconColor} />
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 15,
                  fontWeight: '500',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                Theme
              </Text>
            </View>
            <SegmentedControl
              value={user.theme}
              onChange={(theme) => patch({ theme })}
              options={[
                { label: 'Auto', value: 'auto' },
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
            />
          </View>
          <NavRow
            icon={<Ionicons name="globe-outline" size={20} color={iconColor} />}
            label="Base currency"
            badge={user.baseCurrency}
            onPress={() => setPickingCurrency(true)}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="Voice capture">
          <NavRow
            icon={<Ionicons name="flash-outline" size={20} color={iconColor} />}
            label="Auto-save voice"
            hint="Save expense when AI confidence ≥ 85%"
            rightAccessory={
              <Toggle
                value={user.autoSaveVoice}
                onValueChange={(v) => patch({ autoSaveVoice: v })}
                disabled={saving}
              />
            }
            showChevron={false}
          />
          <NavRow
            icon={<Ionicons name="volume-medium-outline" size={20} color={iconColor} />}
            label="Keep voice audio"
            hint="Store recordings for replay (uses storage)"
            rightAccessory={
              <Toggle
                value={user.keepVoiceAudio}
                onValueChange={(v) => patch({ keepVoiceAudio: v })}
                disabled={saving}
              />
            }
            showChevron={false}
            isLast
          />
        </SectionGroup>

        <Text style={{ textAlign: 'center', fontSize: 11, color: meta, marginTop: 8 }}>
          Changes save instantly.
        </Text>
      </ScrollView>

      <Sheet open={pickingCurrency} onClose={() => setPickingCurrency(false)}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 12,
            color: ink,
          }}
        >
          Base currency
        </Text>
        <View style={{ gap: 6 }}>
          {CURRENCIES.map((c) => {
            const selected = c.code === user.baseCurrency;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  setPickingCurrency(false);
                  if (!selected) patch({ baseCurrency: c.code });
                }}
                style={[
                  {
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected
                      ? isDark
                        ? '#60A5FA'
                        : '#3B82F6'
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(15,23,42,0.06)',
                    backgroundColor: selected
                      ? isDark
                        ? 'rgba(96,165,250,0.12)'
                        : 'rgba(59,130,246,0.08)'
                      : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark
                      ? 'rgba(31,41,55,0.7)'
                      : 'rgba(241,244,248,0.9)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: ink }}>
                    {c.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: ink }}>
                    {c.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: meta }}>{c.name}</Text>
                </View>
                {selected && (
                  <Feather
                    name="check"
                    size={20}
                    color={isDark ? '#60A5FA' : '#3B82F6'}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}
