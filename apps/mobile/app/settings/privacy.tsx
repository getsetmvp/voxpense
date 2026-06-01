// Privacy & data screen — export request, delete account confirmation.

import { useState } from 'react';
import { ScrollView, View, Text, Linking, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Card, Button, Sheet } from '../../src/components/glass';
import { NavRow, ScreenHeader, SectionGroup } from '../../src/components/settings';
import { users } from '../../src/lib/endpoints';
import { useAuth } from '../../src/store/auth';

export default function PrivacyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#CBD5E1' : '#334155';

  const requestExport = async () => {
    const subject = encodeURIComponent('VoxPense data export request');
    const body = encodeURIComponent(
      `Hi,\n\nPlease export all data for my account (${user?.email ?? 'unknown'}).\n\nThanks.`,
    );
    const url = `mailto:yash.g@pei.group?subject=${subject}&body=${body}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('No mail app', 'Email yash.g@pei.group with your request.');
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await users.remove();
      await logout();
      setShowDelete(false);
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Privacy & data" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Card>
          <Text style={{ fontSize: 13, color: ink, lineHeight: 20 }}>
            Your data is stored on PEI Group's voxpense tenant. Voice transcripts and
            receipt photos are sent to AI for parsing. Audio files are only retained
            locally if you enable "Keep voice audio".
          </Text>
        </Card>

        <View style={{ height: 20 }} />

        <SectionGroup title="Your data">
          <NavRow
            icon={<Ionicons name="download-outline" size={20} color={iconColor} />}
            label="Export data"
            hint="Email us — we'll send a JSON dump"
            onPress={requestExport}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="Account">
          <NavRow
            icon={<Ionicons name="log-out-outline" size={20} color={iconColor} />}
            label="Sign out"
            onPress={() => {
              Alert.alert('Sign out?', 'You can sign back in anytime.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => logout() },
              ]);
            }}
          />
          <NavRow
            icon={<Ionicons name="trash-outline" size={20} color="#EF4444" />}
            label="Delete account"
            hint="Permanent. Removes all expenses, wallets, categories."
            destructive
            onPress={() => setShowDelete(true)}
            isLast
          />
        </SectionGroup>

        <Text
          style={{
            fontSize: 11,
            color: meta,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          Privacy questions? Email yash.g@pei.group
        </Text>
      </ScrollView>

      <Sheet open={showDelete} onClose={() => setShowDelete(false)}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark
                  ? 'rgba(248,113,113,0.2)'
                  : 'rgba(239,68,68,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: ink }}>
              Delete account?
            </Text>
          </View>
          <View
            style={{
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(248,113,113,0.3)'
                : 'rgba(239,68,68,0.25)',
              backgroundColor: isDark
                ? 'rgba(248,113,113,0.08)'
                : 'rgba(239,68,68,0.05)',
            }}
          >
            <Text style={{ fontSize: 13, color: ink, lineHeight: 20 }}>
              This will permanently erase your account, all expenses, wallets,
              categories, budgets, recurring entries, and reminders.{'\n'}
              <Text style={{ fontWeight: '700' }}>This cannot be undone.</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="ghost"
                fullWidth
                onPress={() => setShowDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="danger"
                fullWidth
                onPress={confirmDelete}
                loading={deleting}
              >
                Delete forever
              </Button>
            </View>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
