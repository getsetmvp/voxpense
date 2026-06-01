// Privacy settings — data ownership statement, export expenses to JSON via
// Share, delete account confirmation, terms + privacy links.

import { useState } from 'react';
import { ScrollView, View, Text, Linking, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Download, FileText, Shield, Trash2 } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { ListItem } from '../../src/components/ui/ListItem';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { expenses, users } from '../../src/lib/endpoints';

const TERMS_URL = 'https://voxpense.app/terms';
const PRIVACY_URL = 'https://voxpense.app/privacy';

export default function PrivacySettings() {
  const { tokens } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const result = await expenses.list({ limit: 500 });
      const payload = {
        exportedAt: new Date().toISOString(),
        userEmail: user?.email ?? null,
        count: result.data.length,
        expenses: result.data,
      };
      const json = JSON.stringify(payload, null, 2);
      await Share.share({
        message: json,
        title: 'VoxPense expenses export',
      });
      toast.show(`Exported ${result.data.length} expenses`, 'good');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Export failed', 'bad');
    } finally {
      setExporting(false);
    }
  };

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else toast.show('Cannot open link', 'bad');
    } catch {
      toast.show('Cannot open link', 'bad');
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await users.remove();
      await logout();
      setConfirmDelete(false);
      router.replace('/(onboarding)/welcome' as never);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Delete failed', 'bad');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <Header back title="Privacy & data" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
      >
        {/* Statement */}
        <Card>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${tokens.brand}1A`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color={tokens.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '700', color: tokens.ink }}
              >
                Your data is yours
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: tokens.muted,
                  marginTop: 4,
                  lineHeight: 20,
                }}
              >
                VoxPense stores your expenses on our server tied to your account.
                Voice transcripts and receipt photos are sent to AI for parsing
                only. Audio is only retained locally if you enable "Keep voice
                audio" in Preferences.
              </Text>
            </View>
          </View>
        </Card>

        {/* Data actions */}
        <SectionHeader>Your data</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<Download size={18} color={tokens.muted} />}
            title={exporting ? 'Exporting…' : 'Export data'}
            subtitle="Share recent expenses as JSON"
            onPress={exporting ? undefined : onExport}
          />
        </Card>

        {/* Legal */}
        <SectionHeader>Legal</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<FileText size={18} color={tokens.muted} />}
            title="Privacy policy"
            subtitle={PRIVACY_URL}
            onPress={() => openUrl(PRIVACY_URL)}
          />
          <View
            style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
          />
          <ListItem
            leading={<FileText size={18} color={tokens.muted} />}
            title="Terms of service"
            subtitle={TERMS_URL}
            onPress={() => openUrl(TERMS_URL)}
          />
        </Card>

        {/* Danger zone */}
        <SectionHeader>Danger zone</SectionHeader>
        <View style={{ paddingHorizontal: 0 }}>
          <Button
            label="Delete account"
            variant="danger"
            icon={<Trash2 size={16} color={tokens.bad} />}
            onPress={() => setConfirmDelete(true)}
          />
        </View>
        <Text
          style={{
            fontSize: 11,
            color: tokens.muted,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {Platform.OS === 'ios' ? 'iOS' : 'Android'} · Privacy questions?
          yash.g@pei.group
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete account?"
        message="This will permanently erase your account and all data. This cannot be undone."
        destructive
        confirmLabel={deleting ? 'Deleting…' : 'Delete forever'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </Screen>
  );
}
