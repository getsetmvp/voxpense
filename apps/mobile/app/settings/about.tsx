// About settings — logo, version, build date, credits, OSS acknowledgements.

import { ScrollView, View, Text, Linking } from 'react-native';
import Constants from 'expo-constants';
import { Mic, Mail, Heart, Code2, Github, Bug, Lightbulb } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Header } from '../../src/components/layout/Header';
import { SectionHeader } from '../../src/components/layout/SectionHeader';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { ListItem } from '../../src/components/ui/ListItem';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';

interface Acknowledgement {
  name: string;
  desc: string;
}

const OSS_LIBS: Acknowledgement[] = [
  { name: 'Expo', desc: 'React Native runtime + tooling' },
  { name: 'React Query', desc: 'Server state caching' },
  { name: 'Zustand', desc: 'Client state store' },
  { name: 'date-fns', desc: 'Date formatting' },
  { name: 'lucide-react-native', desc: 'Icon set' },
  { name: 'NativeWind', desc: 'Tailwind-style styling' },
];

export default function AboutSettings() {
  const { tokens } = useTheme();
  const toast = useToast();

  const cfg = Constants.expoConfig;
  const version = cfg?.version ?? '0.0.0';
  const runtime =
    typeof cfg?.runtimeVersion === 'string' ? cfg.runtimeVersion : '1.0.0';
  const extra = (cfg?.extra ?? {}) as Record<string, unknown>;
  const env = (extra.env as string | undefined) ?? 'development';
  const buildDate =
    (extra.buildDate as string | undefined) ??
    new Date().toISOString().slice(0, 10);

  const openMail = async (subject: string) => {
    const url = `mailto:yash.g@pei.group?subject=${encodeURIComponent(subject)}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else toast.show('No mail app found', 'bad');
    } catch {
      toast.show('Could not open mail', 'bad');
    }
  };

  return (
    <Screen>
      <Header back title="About" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
      >
        {/* Hero */}
        <Card>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: tokens.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={34} color="#FFFFFF" />
            </View>
            <Text
              style={{ fontSize: 22, fontWeight: '700', color: tokens.ink }}
            >
              VoxPense
            </Text>
            <Text style={{ fontSize: 13, color: tokens.muted }}>
              Voice-first expense tracker
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              <Chip label={`v${version}`} variant="brand" />
              <Chip label={env} variant="default" />
              <Chip label={`runtime ${runtime}`} variant="default" />
            </View>
            <Text
              style={{
                fontSize: 11,
                color: tokens.muted,
                marginTop: 6,
              }}
            >
              Build {buildDate}
            </Text>
          </View>
        </Card>

        {/* Credit */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: tokens.ink }}>
              Made with
            </Text>
            <Heart size={16} color={tokens.bad} fill={tokens.bad} />
            <Text style={{ fontSize: 14, color: tokens.ink, fontWeight: '600' }}>
              by Yash
            </Text>
          </View>
        </Card>

        {/* Support */}
        <SectionHeader>Support</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<Mail size={18} color={tokens.muted} />}
            title="Contact"
            subtitle="yash.g@pei.group"
            onPress={() => openMail('VoxPense support')}
          />
          <View
            style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
          />
          <ListItem
            leading={<Bug size={18} color={tokens.muted} />}
            title="Report an issue"
            subtitle="Help me make VoxPense better"
            onPress={() => openMail('VoxPense bug report')}
          />
          <View
            style={{ height: 1, backgroundColor: tokens.border, marginLeft: 14 }}
          />
          <ListItem
            leading={<Lightbulb size={18} color={tokens.muted} />}
            title="Suggest a feature"
            subtitle="What would you like to see?"
            onPress={() => openMail('VoxPense feature request')}
          />
        </Card>

        {/* OSS */}
        <SectionHeader>Open source</SectionHeader>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {OSS_LIBS.map((lib, idx) => (
            <View key={lib.name}>
              {idx > 0 ? (
                <View
                  style={{
                    height: 1,
                    backgroundColor: tokens.border,
                    marginLeft: 14,
                  }}
                />
              ) : null}
              <ListItem
                leading={<Code2 size={18} color={tokens.muted} />}
                title={lib.name}
                subtitle={lib.desc}
              />
            </View>
          ))}
        </Card>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListItem
            leading={<Github size={18} color={tokens.muted} />}
            title="View source"
            subtitle="github.com/yashgupta/voxpense"
            onPress={() =>
              Linking.openURL('https://github.com/yashgupta/voxpense').catch(
                () => toast.show('Cannot open link', 'bad'),
              )
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
          © {new Date().getFullYear()} Yash Gupta · All rights reserved
        </Text>
      </ScrollView>
    </Screen>
  );
}
