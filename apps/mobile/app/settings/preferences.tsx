// Preferences settings — theme selector, base currency, voice toggles, locale.
// Theme bound to useThemeStore. Currency + voice flags persist via users.update.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import { Sun, Moon, Smartphone, Check, Globe, Mic, Headphones } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Card } from '../../src/components/ui/Card';
import { ListItem } from '../../src/components/ui/ListItem';
import { Sheet } from '../../src/components/ui/Sheet';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useThemeStore, type ThemeMode } from '../../src/store/theme';
import { useAuth } from '../../src/store/auth';
import { users } from '../../src/lib/endpoints';
import { SEED_CURRENCIES } from '../../src/lib/currencies';

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'auto', label: 'Auto', Icon: Smartphone },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function PreferencesSettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const refreshUser = useAuth((s) => s.refreshUser);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  const selectedCurrency = useMemo(
    () =>
      SEED_CURRENCIES.find((c) => c.code === (user?.baseCurrency ?? 'INR')) ??
      SEED_CURRENCIES[0]!,
    [user?.baseCurrency],
  );

  const patch = async (
    body: Parameters<typeof users.update>[0],
    field: string,
  ) => {
    setSavingField(field);
    try {
      const updated = await users.update(body);
      setUser(updated);
      await refreshUser();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Update failed', 'bad');
    } finally {
      setSavingField(null);
    }
  };

  const onThemePick = (next: ThemeMode) => {
    setMode(next);
    // Also persist on server so it syncs across devices.
    patch({ theme: next }, 'theme').catch(() => {});
  };

  return (
    <Screen>
      <Header back title="Preferences" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
      >
        {/* Theme */}
        <SectionHeader>Appearance</SectionHeader>
        <Card>
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tokens.ink }}>
              Theme
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const active = mode === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => onThemePick(value)}
                    style={{
                      flex: 1,
                      height: 64,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? tokens.brand : tokens.border,
                      backgroundColor: active
                        ? `${tokens.brand}1A`
                        : tokens.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon
                      size={18}
                      color={active ? tokens.brand : tokens.ink}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? tokens.brand : tokens.ink,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Money */}
        <SectionHeader>Money</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<Globe size={18} color={tokens.muted} />}
            title="Base currency"
            subtitle={selectedCurrency.name}
            trailingText={`${selectedCurrency.symbol} ${selectedCurrency.code}`}
            onPress={() => setCurrencyOpen(true)}
          />
          <View
            style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
          />
          <ListItem
            leading={<Globe size={18} color={tokens.muted} />}
            title="Locale"
            subtitle="Used for dates and number formatting"
            trailingText="en-IN"
          />
        </Card>

        {/* Voice capture */}
        <SectionHeader>Voice capture</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<Mic size={18} color={tokens.muted} />}
            title="Auto-save voice"
            subtitle="High-confidence entries save without confirm"
            trailing={
              <Switch
                value={!!user?.autoSaveVoice}
                onValueChange={(v) =>
                  patch({ autoSaveVoice: v }, 'autoSaveVoice')
                }
                disabled={savingField !== null}
                trackColor={{ false: tokens.border, true: tokens.brand }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View
            style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
          />
          <ListItem
            leading={<Headphones size={18} color={tokens.muted} />}
            title="Keep voice audio"
            subtitle="Store the recording with each expense"
            trailing={
              <Switch
                value={!!user?.keepVoiceAudio}
                onValueChange={(v) =>
                  patch({ keepVoiceAudio: v }, 'keepVoiceAudio')
                }
                disabled={savingField !== null}
                trackColor={{ false: tokens.border, true: tokens.brand }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Card>

        <Text
          style={{
            fontSize: 11,
            color: tokens.muted,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Changes save instantly.
        </Text>
      </ScrollView>

      <Sheet
        visible={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        heightPct={75}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
            color: tokens.ink,
            marginBottom: 12,
          }}
        >
          Base currency
        </Text>
        <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 4 }}>
          {SEED_CURRENCIES.map((c) => {
            const selected = c.code === user?.baseCurrency;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  setCurrencyOpen(false);
                  if (!selected) patch({ baseCurrency: c.code }, 'baseCurrency');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? tokens.brand : tokens.border,
                  backgroundColor: selected
                    ? `${tokens.brand}1A`
                    : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: tokens.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{ fontWeight: '700', color: tokens.ink, fontSize: 14 }}
                  >
                    {c.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: tokens.ink,
                    }}
                  >
                    {c.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: tokens.muted }}>
                    {c.name}
                  </Text>
                </View>
                {selected ? <Check size={20} color={tokens.brand} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
