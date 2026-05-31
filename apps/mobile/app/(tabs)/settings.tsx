// Settings tab overview — grouped nav rows linking into settings/* sub-pages.

import { ScrollView, View, Text, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen, Card } from '../../src/components/glass';
import { NavRow, SectionGroup } from '../../src/components/settings';
import { useAuth } from '../../src/store/auth';
import {
  useBudgets,
  useCategories,
  useRecurring,
  useReminders,
  useWallets,
} from '../../src/queries/insights';

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);

  const wallets = useWallets();
  const categories = useCategories();
  const budgets = useBudgets();
  const recurring = useRecurring();
  const reminders = useReminders();

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#CBD5E1' : '#334155';

  const initials = (() => {
    const name = user?.name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      const first = parts[0]?.[0] ?? '';
      const second = parts[1]?.[0] ?? '';
      return (first + second).toUpperCase() || 'V';
    }
    return user?.email?.[0]?.toUpperCase() ?? 'V';
  })();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: ink, marginBottom: 16 }}>
          Settings
        </Text>

        {/* Profile card */}
        <Pressable
          onPress={() => router.push('/settings/profile')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: 20 })}
        >
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: ink }}>
                  {user?.name?.trim() || 'Set your name'}
                </Text>
                <Text
                  style={{ fontSize: 12, color: meta, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {user?.email ?? '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={meta} />
            </View>
          </Card>
        </Pressable>

        <SectionGroup title="Personalize">
          <NavRow
            icon={<Ionicons name="person-circle-outline" size={20} color={iconColor} />}
            label="Profile"
            onPress={() => router.push('/settings/profile')}
          />
          <NavRow
            icon={<Ionicons name="options-outline" size={20} color={iconColor} />}
            label="Preferences"
            hint="Theme, currency, voice options"
            onPress={() => router.push('/settings/preferences')}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="Money">
          <NavRow
            icon={<Ionicons name="card-outline" size={20} color={iconColor} />}
            label="Wallets"
            badge={wallets.data?.length ?? '—'}
            onPress={() => router.push('/settings/wallets')}
          />
          <NavRow
            icon={<Ionicons name="pricetag-outline" size={20} color={iconColor} />}
            label="Categories"
            badge={categories.data?.length ?? '—'}
            onPress={() => router.push('/settings/categories')}
          />
          <NavRow
            icon={<Ionicons name="pie-chart-outline" size={20} color={iconColor} />}
            label="Budgets"
            badge={budgets.data?.length ?? '—'}
            onPress={() => router.push('/settings/budgets')}
          />
          <NavRow
            icon={<Ionicons name="repeat-outline" size={20} color={iconColor} />}
            label="Recurring"
            badge={recurring.data?.length ?? '—'}
            onPress={() => router.push('/settings/recurring')}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="Notifications">
          <NavRow
            icon={<Ionicons name="notifications-outline" size={20} color={iconColor} />}
            label="Reminders"
            badge={reminders.data?.length ?? '—'}
            onPress={() => router.push('/settings/reminders')}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="App">
          <NavRow
            icon={<Ionicons name="shield-checkmark-outline" size={20} color={iconColor} />}
            label="Privacy & data"
            onPress={() => router.push('/settings/privacy')}
          />
          <NavRow
            icon={<Ionicons name="information-circle-outline" size={20} color={iconColor} />}
            label="About"
            onPress={() => router.push('/settings/about')}
            isLast
          />
        </SectionGroup>
      </ScrollView>
    </Screen>
  );
}
