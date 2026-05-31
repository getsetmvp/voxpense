// Placeholder screen used by Phase 5 foundation. Each agent replaces these
// with the real screen content per design.md mockups + § 19 partition.

import { Screen } from './Screen';
import { Card } from './Card';
import { View, Text, useColorScheme } from 'react-native';

interface StubProps {
  name: string;
  owner: string;
  note?: string;
}

export function Stub({ name, owner, note }: StubProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch', padding: 24 }}>
        <Card>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              marginBottom: 8,
              color: scheme === 'dark' ? '#F8FAFC' : '#0F172A',
            }}
          >
            {name}
          </Text>
          <Text style={{ fontSize: 13, color: scheme === 'dark' ? '#94A3B8' : '#64748B', marginBottom: 12 }}>
            Phase 5 placeholder · owned by Agent {owner}
          </Text>
          {note && (
            <Text style={{ fontSize: 14, color: scheme === 'dark' ? '#CBD5E1' : '#334155', lineHeight: 20 }}>
              {note}
            </Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}
