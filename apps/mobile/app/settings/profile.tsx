// 28. ProfileScreen — avatar + name + email + base currency + voice prefs +
// theme + sign out. PATCH /users/me on save / row toggle, then refreshUser().

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Card, Button, Input, Sheet } from '../../src/components/glass';
import { ApiError } from '../../src/lib/api';
import { users } from '../../src/lib/endpoints';
import { useAuth } from '../../src/store/auth';
import { FormBanner } from '../../src/components/auth/FormBanner';
import { formatDate } from '../../src/lib/format';
import type { User } from '@voxpense/shared-types';

type ThemeMode = User['theme'];

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
];

const THEMES: { value: ThemeMode; label: string; icon: 'smartphone' | 'sun' | 'moon' }[] = [
  { value: 'auto', label: 'Auto', icon: 'smartphone' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

function initialsFrom(user: User | null): string {
  if (!user) return '·';
  const source = user.name?.trim() || user.email;
  if (!source) return '·';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0] ?? '').join('');
  return letters.toUpperCase() || '·';
}

// "Member since Jun 2026" when createdAt is a valid ISO string, otherwise a
// plain "VoxPense member" so the line is never empty or shows "Invalid Date".
function memberSinceLabel(createdAt: string | undefined | null): string {
  if (!createdAt) return 'VoxPense member';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 'VoxPense member';
  return `Member since ${formatDate(createdAt, 'MMM yyyy')}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const refreshUser = useAuth((s) => s.refreshUser);
  const logout = useAuth((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [togglingField, setTogglingField] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const dirtyName = useMemo(
    () => (name.trim() || null) !== (user?.name ?? null),
    [name, user?.name],
  );

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === user?.baseCurrency) ?? CURRENCIES[0]!,
    [user?.baseCurrency],
  );

  const themeOpt = useMemo(
    () => THEMES.find((t) => t.value === user?.theme) ?? THEMES[0]!,
    [user?.theme],
  );

  async function patch(body: Parameters<typeof users.update>[0], field: string) {
    setError(undefined);
    setTogglingField(field);
    try {
      const updated = await users.update(body);
      setUser(updated);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.message ?? 'Could not save changes.')
          : 'Network error. Check your connection.';
      setError(msg);
    } finally {
      setTogglingField(null);
      // Best-effort cross-screen freshness without surfacing a second error.
      refreshUser().catch(() => {});
    }
  }

  async function saveName() {
    if (!dirtyName) return;
    const trimmed = name.trim();
    setSavingName(true);
    setError(undefined);
    try {
      const updated = await users.update({ name: trimmed.length > 0 ? trimmed : undefined });
      setUser(updated);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.message ?? 'Could not save name.')
          : 'Network error. Check your connection.';
      setError(msg);
    } finally {
      setSavingName(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      // AuthGate will redirect.
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header bar */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home' as never))}
              style={({ pressed }) => [
                profileStyles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.85)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="arrow-left" size={18} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
              Profile
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ padding: 20, gap: 16 }}>
            {/* Avatar block — mockup 28: 96px circle, camera badge bottom-right. */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#3B82F6',
                    shadowOpacity: 0.3,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 8,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>
                    {initialsFrom(user)}
                  </Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: isDark ? '#0F172A' : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather
                    name="camera"
                    size={14}
                    color={isDark ? '#CBD5E1' : '#334155'}
                  />
                </View>
              </View>
              {user && (
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 10,
                    color: isDark ? '#94A3B8' : '#64748B',
                  }}
                >
                  {memberSinceLabel(user.createdAt)}
                </Text>
              )}
            </View>

            {error && <FormBanner message={error} tone="error" />}

            {/* Account card */}
            <Card padded>
              <View style={{ gap: 16 }}>
                <Input
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={saveName}
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
                  value={user?.email ?? ''}
                  editable={false}
                  selectTextOnFocus={false}
                  leftIcon={
                    <Feather
                      name="mail"
                      size={16}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                  }
                  rightIcon={
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.18)'
                          : 'rgba(16,185,129,0.12)',
                      }}
                    >
                      <Feather
                        name="check"
                        size={12}
                        color={isDark ? '#34D399' : '#059669'}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: isDark ? '#34D399' : '#059669',
                        }}
                      >
                        verified
                      </Text>
                    </View>
                  }
                />
                {dirtyName && (
                  <Button
                    size="md"
                    variant="secondary"
                    fullWidth
                    loading={savingName}
                    disabled={savingName}
                    onPress={saveName}
                  >
                    Save name
                  </Button>
                )}
              </View>
            </Card>

            {/* Preferences card */}
            <SectionLabel>Preferences</SectionLabel>
            <Card padded={false}>
              <Row
                icon="globe"
                label="Base currency"
                rightSlot={
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    {currency.symbol} {currency.code}
                  </Text>
                }
                onPress={() => setCurrencyOpen(true)}
                isDark={isDark}
                chevron
                first
              />
              <Row
                icon="moon"
                label="Theme"
                rightSlot={
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    {themeOpt.label}
                  </Text>
                }
                onPress={() => setThemeOpen(true)}
                isDark={isDark}
                chevron
              />
              <Row
                icon="mic"
                label="Auto-save voice"
                sublabel="High-confidence entries save without confirm"
                rightSlot={
                  togglingField === 'autoSaveVoice' ? (
                    <ActivityIndicator color={isDark ? '#60A5FA' : '#3B82F6'} />
                  ) : (
                    <Switch
                      value={!!user?.autoSaveVoice}
                      onValueChange={(v) =>
                        patch({ autoSaveVoice: v }, 'autoSaveVoice')
                      }
                      disabled={!!togglingField}
                      trackColor={{
                        false: isDark ? '#374151' : '#E5EAF1',
                        true: isDark ? '#1E40AF' : '#3B82F6',
                      }}
                      thumbColor="#FFFFFF"
                    />
                  )
                }
                isDark={isDark}
              />
              <Row
                icon="headphones"
                label="Keep voice audio"
                sublabel="Store the recording with each expense"
                rightSlot={
                  togglingField === 'keepVoiceAudio' ? (
                    <ActivityIndicator color={isDark ? '#60A5FA' : '#3B82F6'} />
                  ) : (
                    <Switch
                      value={!!user?.keepVoiceAudio}
                      onValueChange={(v) =>
                        patch({ keepVoiceAudio: v }, 'keepVoiceAudio')
                      }
                      disabled={!!togglingField}
                      trackColor={{
                        false: isDark ? '#374151' : '#E5EAF1',
                        true: isDark ? '#1E40AF' : '#3B82F6',
                      }}
                      thumbColor="#FFFFFF"
                    />
                  )
                }
                isDark={isDark}
                last
              />
            </Card>

            {/* Account actions */}
            <SectionLabel>Account</SectionLabel>
            <Button
              size="lg"
              variant="danger"
              fullWidth
              loading={loggingOut}
              disabled={loggingOut}
              onPress={onLogout}
              leftIcon={
                <Feather
                  name="log-out"
                  size={16}
                  color="#FFFFFF"
                />
              }
            >
              Log out
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency picker sheet */}
      <Sheet open={currencyOpen} onClose={() => setCurrencyOpen(false)}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          Base currency
        </Text>
        <View style={{ gap: 6 }}>
          {CURRENCIES.map((c) => {
            const selected = c.code === user?.baseCurrency;
            return (
              <Pressable
                key={c.code}
                onPress={async () => {
                  setCurrencyOpen(false);
                  if (!selected) await patch({ baseCurrency: c.code }, 'baseCurrency');
                }}
                style={({ pressed }) => [
                  profileStyles.pickerOption,
                  {
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
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  >
                    {c.code}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? '#94A3B8' : '#64748B',
                    }}
                  >
                    {c.name} · {c.symbol}
                  </Text>
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

      {/* Theme picker sheet */}
      <Sheet open={themeOpen} onClose={() => setThemeOpen(false)}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          Theme
        </Text>
        <View style={{ gap: 6 }}>
          {THEMES.map((t) => {
            const selected = t.value === user?.theme;
            return (
              <Pressable
                key={t.value}
                onPress={async () => {
                  setThemeOpen(false);
                  if (!selected) await patch({ theme: t.value }, 'theme');
                }}
                style={({ pressed }) => [
                  profileStyles.themeOption,
                  {
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
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name={t.icon}
                  size={18}
                  color={isDark ? '#F8FAFC' : '#0F172A'}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                >
                  {t.label}
                </Text>
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

// ── helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginTop: 4,
        marginBottom: -4,
        color: scheme === 'dark' ? '#94A3B8' : '#64748B',
      }}
    >
      {children}
    </Text>
  );
}

interface RowProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  sublabel?: string;
  rightSlot?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  first?: boolean;
  last?: boolean;
  isDark: boolean;
}

function Row({ icon, label, sublabel, rightSlot, onPress, chevron, first, last, isDark }: RowProps) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          {label}
        </Text>
        {sublabel && (
          <Text
            style={{
              fontSize: 11,
              marginTop: 2,
              color: isDark ? '#94A3B8' : '#64748B',
              lineHeight: 14,
            }}
          >
            {sublabel}
          </Text>
        )}
      </View>
      {rightSlot}
      {chevron && (
        <Feather
          name="chevron-right"
          size={18}
          color={isDark ? '#64748B' : '#94A3B8'}
        />
      )}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        last ? profileStyles.lastRow : null,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {inner}
    </Pressable>
  );
}

const profileStyles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerOption: {
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOption: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lastRow: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
