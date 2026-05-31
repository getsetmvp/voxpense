// Preferences screen — theme, base currency, voice toggles. Patches via users.update.

import { useState } from 'react';
import { ScrollView, View, Text, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/glass';
import {
  NavRow,
  ScreenHeader,
  SectionGroup,
  SegmentedControl,
  Toggle,
} from '../../src/components/settings';
import { users } from '../../src/lib/endpoints';
import { useAuth } from '../../src/store/auth';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'JPY'];

export default function PreferencesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);
  const setUser = useAuth((s) => s.setUser);

  const [saving, setSaving] = useState(false);
  const [pickingCurrency, setPickingCurrency] = useState(false);

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
            onPress={() => setPickingCurrency((v) => !v)}
            isLast={!pickingCurrency}
          />
          {pickingCurrency && (
            <View
              style={{
                paddingHorizontal: 14,
                paddingBottom: 14,
                paddingTop: 4,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {CURRENCIES.map((c) => {
                const selected = c === user.baseCurrency;
                return (
                  <View
                    key={c}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: selected
                        ? isDark ? '#60A5FA' : '#3B82F6'
                        : isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)',
                    }}
                  >
                    <Text
                      onPress={() => {
                        patch({ baseCurrency: c });
                        setPickingCurrency(false);
                      }}
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: selected ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155',
                      }}
                    >
                      {c}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
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
    </Screen>
  );
}
