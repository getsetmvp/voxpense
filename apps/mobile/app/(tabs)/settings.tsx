// Settings landing — mockup 22.
// User card at top + grouped ListItem rows for sub-routes + Log out.

import { ScrollView, Text, View } from 'react-native';
import {
  Bell,
  ChevronRight,
  Folder,
  Info,
  LogOut,
  PieChart,
  Repeat,
  Settings as SettingsIcon,
  Shield,
  Tag,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Screen } from '../../src/components/layout/Screen';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { ListItem } from '../../src/components/ui/ListItem';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';

export default function SettingsTab() {
  const { tokens } = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const chevron = <ChevronRight size={18} color={tokens.muted} />;

  const initials = (() => {
    const name = user?.name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      const a = parts[0]?.[0] ?? '';
      const b = parts[1]?.[0] ?? '';
      return (a + b).toUpperCase() || 'V';
    }
    return user?.email?.[0]?.toUpperCase() ?? 'V';
  })();

  const onLogout = async () => {
    await logout();
    router.replace('/(onboarding)/welcome');
  };

  // Helpers for grouped cards: single border + dividers between rows
  const groupCard = {
    borderRadius: 16,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: tokens.border,
    overflow: 'hidden' as const,
    marginBottom: 16,
  };
  const divider = (
    <View style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }} />
  );

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.ink }}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: `${tokens.brand}26`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: tokens.brand, fontWeight: '700', fontSize: 18 }}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontWeight: '600', color: tokens.ink, fontSize: 15 }}
              numberOfLines={1}
            >
              {user?.name?.trim() || 'Set your name'}
            </Text>
            <Text
              style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}
              numberOfLines={1}
            >
              {user?.email ?? 'Not signed in'}
            </Text>
          </View>
        </View>

        {/* PERSONALIZE */}
        <SectionHeader>Personalize</SectionHeader>
        <View style={groupCard}>
          <ListItem
            leading={<UserIcon size={18} color={tokens.ink} />}
            title="Profile"
            trailing={chevron}
            onPress={() => router.push('/settings/profile')}
          />
          {divider}
          <ListItem
            leading={<SettingsIcon size={18} color={tokens.ink} />}
            title="Preferences"
            subtitle="Theme, currency, voice"
            trailing={chevron}
            onPress={() => router.push('/settings/preferences')}
          />
        </View>

        {/* MONEY */}
        <SectionHeader>Money</SectionHeader>
        <View style={groupCard}>
          <ListItem
            leading={<WalletIcon size={18} color={tokens.ink} />}
            title="Wallets"
            trailing={chevron}
            onPress={() => router.push('/settings/wallets')}
          />
          {divider}
          <ListItem
            leading={<Folder size={18} color={tokens.ink} />}
            title="Groups"
            trailing={chevron}
            onPress={() => router.push('/settings/groups')}
          />
          {divider}
          <ListItem
            leading={<Tag size={18} color={tokens.ink} />}
            title="Categories"
            trailing={chevron}
            onPress={() => router.push('/settings/categories')}
          />
          {divider}
          <ListItem
            leading={<PieChart size={18} color={tokens.ink} />}
            title="Budgets"
            trailing={chevron}
            onPress={() => router.push('/settings/budgets')}
          />
          {divider}
          <ListItem
            leading={<Repeat size={18} color={tokens.ink} />}
            title="Recurring"
            trailing={chevron}
            onPress={() => router.push('/settings/recurring')}
          />
        </View>

        {/* NOTIFICATIONS */}
        <SectionHeader>Notifications</SectionHeader>
        <View style={groupCard}>
          <ListItem
            leading={<Bell size={18} color={tokens.ink} />}
            title="Reminders"
            trailing={chevron}
            onPress={() => router.push('/settings/reminders')}
          />
        </View>

        {/* APP */}
        <SectionHeader>App</SectionHeader>
        <View style={groupCard}>
          <ListItem
            leading={<Shield size={18} color={tokens.ink} />}
            title="Privacy"
            trailing={chevron}
            onPress={() => router.push('/settings/privacy')}
          />
          {divider}
          <ListItem
            leading={<Info size={18} color={tokens.ink} />}
            title="About"
            trailing={chevron}
            onPress={() => router.push('/settings/about')}
          />
          {divider}
          <ListItem
            leading={<LogOut size={18} color={tokens.bad} />}
            title="Log out"
            onPress={onLogout}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
