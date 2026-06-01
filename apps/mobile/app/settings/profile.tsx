// Profile settings — large avatar (initial), editable name, read-only email.
// Account section: change password (placeholder), delete account (destructive).
// Logout button at bottom.

import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Trash2, LogOut } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ListItem } from '../../src/components/ui/ListItem';
import { Banner } from '../../src/components/ui/Banner';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { users } from '../../src/lib/endpoints';
import type { User } from '@voxpense/shared-types';

function initialsFrom(user: User | null): string {
  if (!user) return '?';
  const src = user.name?.trim() || user.email;
  if (!src) return '?';
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0] ?? '').join('') || '?').toUpperCase();
}

export default function ProfileSettings() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const refreshUser = useAuth((s) => s.refreshUser);
  const logout = useAuth((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const dirty = useMemo(
    () => (name.trim() || null) !== (user?.name ?? null),
    [name, user?.name],
  );

  const onSave = async () => {
    if (!user || !dirty) return;
    setSaving(true);
    try {
      const trimmed = name.trim();
      const updated = await users.update({
        name: trimmed.length > 0 ? trimmed : undefined,
      });
      setUser(updated);
      await refreshUser();
      toast.show('Saved', 'good');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not save', 'bad');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(onboarding)/welcome' as never);
    } finally {
      setLoggingOut(false);
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
      <Header back title="Profile" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: tokens.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>
                {initialsFrom(user)}
              </Text>
            </View>
            <Text style={{ marginTop: 10, fontSize: 12, color: tokens.muted }}>
              {user?.email ?? ''}
            </Text>
          </View>

          {/* Name + email card */}
          <Card>
            <View style={{ gap: 12 }}>
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={onSave}
              />
              <Input
                label="Email"
                value={user?.email ?? ''}
                editable={false}
                selectTextOnFocus={false}
              />
              <Button
                label={dirty ? 'Save changes' : 'No changes'}
                variant={dirty ? 'brand' : 'ghost'}
                loading={saving}
                disabled={!dirty || saving}
                onPress={onSave}
              />
            </View>
          </Card>

          {/* Account section */}
          <SectionHeader>Account</SectionHeader>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ListItem
              leading={<Lock size={18} color={tokens.muted} />}
              title="Change password"
              subtitle="Coming soon — request via support email"
              onPress={() =>
                toast.show('Password change not yet available', 'info')
              }
            />
            <View
              style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
            />
            <ListItem
              leading={<Mail size={18} color={tokens.muted} />}
              title="Contact support"
              subtitle="yash.g@pei.group"
              onPress={() => toast.show('Email yash.g@pei.group', 'info')}
            />
          </Card>

          <Banner
            kind="warn"
            text="Account actions are permanent. Make sure you have a backup of your data first."
          />

          <View style={{ gap: 8 }}>
            <Button
              label="Delete account"
              variant="danger"
              icon={<Trash2 size={16} color={tokens.bad} />}
              onPress={() => setConfirmDelete(true)}
            />
            <Button
              label="Log out"
              variant="ghost"
              icon={<LogOut size={16} color={tokens.ink} />}
              loading={loggingOut}
              onPress={onLogout}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete account?"
        message="This will permanently erase your account, all expenses, wallets, categories, budgets, and reminders. This cannot be undone."
        destructive
        confirmLabel={deleting ? 'Deleting…' : 'Delete forever'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </Screen>
  );
}
