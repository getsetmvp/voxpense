// Ask AI chat tab — mockup 21.
// Chat history (user / assistant bubbles) + composer.
// Window: last 30 days. Suggested prompts shown when history is empty.

import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowUp, Search, Sparkles } from 'lucide-react-native';

import { Screen } from '../../src/components/layout/Screen';
import { Chip } from '../../src/components/ui/Chip';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ai } from '../../src/lib/endpoints';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

const SUGGESTED = [
  'How much did I spend last week?',
  'Top merchants this month',
  'Show food spending trend',
  'Office vs personal this month',
];

export default function AskScreen() {
  const { tokens } = useTheme();
  const toast = useToast();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scroll = useRef<ScrollView | null>(null);

  // Last 30 days window
  const { fromIso, toIso } = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }, []);

  const send = async (override?: string) => {
    const q = (override ?? text).trim();
    if (!q || loading) return;
    setText('');
    const uId = `u-${Date.now()}`;
    setMsgs((prev) => [...prev, { id: uId, role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await ai.ask({ question: q, from: fromIso, to: toIso });
      const aId = `a-${Date.now()}`;
      setMsgs((prev) => [
        ...prev,
        { id: aId, role: 'assistant', text: res.answer },
      ]);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'AI unavailable', 'bad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: tokens.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>
            Ask Voxpense
          </Text>
          <Text style={{ fontSize: 11, color: tokens.muted, marginTop: 1 }}>
            Natural-language Q&amp;A · last 30 days
          </Text>
        </View>
      </View>

      {/* Chat history */}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 24, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {msgs.length === 0 ? (
          <View style={{ paddingTop: 24, gap: 16 }}>
            <Text
              style={{
                fontSize: 14,
                color: tokens.muted,
                textAlign: 'center',
              }}
            >
              Ask anything about your spending.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {SUGGESTED.map((s) => (
                <Pressable key={s} onPress={() => void send(s)}>
                  <Chip label={s} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {msgs.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={{ alignItems: 'flex-end' }}>
              <View
                style={{
                  maxWidth: '80%',
                  borderRadius: 16,
                  backgroundColor: tokens.brand,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View
              key={m.id}
              style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: `${tokens.brand}26`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={14} color={tokens.brand} />
              </View>
              <View
                style={{
                  maxWidth: '85%',
                  borderRadius: 16,
                  backgroundColor: tokens.surface,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  padding: 12,
                }}
              >
                <Text style={{ color: tokens.ink, fontSize: 14, lineHeight: 20 }}>
                  {m.text}
                </Text>
              </View>
            </View>
          ),
        )}
        {loading ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: `${tokens.brand}26`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={14} color={tokens.brand} />
            </View>
            <ActivityIndicator color={tokens.brand} />
          </View>
        ) : null}
      </ScrollView>

      {/* Composer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: tokens.border,
          padding: 12,
          backgroundColor: tokens.bg,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: tokens.surface,
            borderRadius: 16,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <Search size={16} color={tokens.muted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => void send()}
            placeholder="Ask about your expenses…"
            placeholderTextColor={tokens.muted}
            style={{ flex: 1, height: 44, color: tokens.ink, fontSize: 14 }}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => void send()}
            disabled={loading || text.trim().length === 0}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor:
                text.trim().length === 0 || loading
                  ? tokens.border
                  : tokens.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowUp size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
