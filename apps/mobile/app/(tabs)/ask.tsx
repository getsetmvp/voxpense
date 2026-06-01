// Ask AI tab. Full-screen AskInput surface (the same component embedded in Insights),
// hosted as its own tab per mockup `(tabs)/ask` route.

import { SafeAreaView, ScrollView, Text, View, useColorScheme } from 'react-native';
import { AskInput } from '../../src/components/insights/AskInput';

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AskScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          >
            Ask
          </Text>
          <Text
            style={{
              fontSize: 13,
              marginTop: 4,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            Natural-language Q&A over your expenses.
          </Text>
        </View>
        <AskInput from={startOfMonthISO()} to={todayISO()} />
      </ScrollView>
    </SafeAreaView>
  );
}
