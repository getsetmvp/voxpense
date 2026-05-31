// About screen — version, build env, legal links.

import { ScrollView, View, Text, Linking, useColorScheme, Alert } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Card } from '../../src/components/glass';
import { NavRow, ScreenHeader, SectionGroup } from '../../src/components/settings';

export default function AboutScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const cfg = Constants.expoConfig;
  const extra = (cfg?.extra ?? {}) as Record<string, unknown>;
  const version = cfg?.version ?? '0.0.0';
  const env = (extra.env as string | undefined) ?? 'development';
  const runtimeVersion =
    (typeof cfg?.runtimeVersion === 'string' ? cfg.runtimeVersion : null) ?? '1.0.0';

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#CBD5E1' : '#334155';

  const openMail = async (subject: string) => {
    const url = `mailto:yash.g@pei.group?subject=${encodeURIComponent(subject)}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('No mail app', 'Email yash.g@pei.group.');
  };

  return (
    <Screen>
      <ScreenHeader title="About" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Card>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mic" size={30} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: ink }}>
              VoxPense
            </Text>
            <Text style={{ fontSize: 13, color: meta }}>
              Voice-first expense tracker
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: meta,
                marginTop: 4,
              }}
            >
              v{version} · {env} · rt {runtimeVersion}
            </Text>
          </View>
        </Card>

        <View style={{ height: 20 }} />

        <SectionGroup title="Legal">
          <NavRow
            icon={<Ionicons name="document-text-outline" size={20} color={iconColor} />}
            label="Privacy policy"
            onPress={() => openMail('Request: privacy policy')}
          />
          <NavRow
            icon={<Ionicons name="document-outline" size={20} color={iconColor} />}
            label="Terms of service"
            onPress={() => openMail('Request: terms of service')}
            isLast
          />
        </SectionGroup>

        <SectionGroup title="Support">
          <NavRow
            icon={<Ionicons name="bug-outline" size={20} color={iconColor} />}
            label="Report an issue"
            onPress={() => openMail('VoxPense bug report')}
          />
          <NavRow
            icon={<Ionicons name="bulb-outline" size={20} color={iconColor} />}
            label="Suggest a feature"
            onPress={() => openMail('VoxPense feature request')}
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
          Made with care by Yash · 2026
        </Text>
      </ScrollView>
    </Screen>
  );
}
