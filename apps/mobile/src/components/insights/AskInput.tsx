// AI ask input — text area with submit button. Calls ai.ask().

import { useState } from 'react';
import { View, Text, useColorScheme, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Input } from '../glass';
import { ai } from '../../lib/endpoints';

interface AskInputProps {
  from: string;
  to: string;
}

interface Conversation {
  q: string;
  a: string | null;
  error: string | null;
}

export function AskInput({ from, to }: AskInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);

  const submit = async () => {
    const q = text.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    const idx = history.length;
    setHistory((prev) => [...prev, { q, a: null, error: null }]);
    setText('');
    try {
      const res = await ai.ask({ question: q, from, to });
      setHistory((prev) =>
        prev.map((h, i) => (i === idx ? { ...h, a: res.answer } : h)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to ask. Try again.';
      setHistory((prev) =>
        prev.map((h, i) => (i === idx ? { ...h, error: msg } : h)),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Ask anything about your spending..."
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={submit}
            returnKeyType="send"
            blurOnSubmit
          />
        </View>
        <Pressable
          onPress={submit}
          disabled={submitting || !text.trim()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting || !text.trim() ? 0.5 : pressed ? 0.85 : 1,
          })}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
      {history.length === 0 && (
        <Text
          style={{
            fontSize: 12,
            color: isDark ? '#64748B' : '#94A3B8',
            fontStyle: 'italic',
          }}
        >
          Try: "How much did I spend on food this week?" · "Top merchants this month"
        </Text>
      )}
      {history
        .slice()
        .reverse()
        .map((h, i) => (
          <Card key={`${i}-${h.q}`} intensity="sm">
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isDark ? '#F8FAFC' : '#0F172A',
                marginBottom: 6,
              }}
            >
              You: {h.q}
            </Text>
            {h.a !== null && (
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#CBD5E1' : '#334155',
                  lineHeight: 20,
                }}
              >
                {h.a}
              </Text>
            )}
            {h.error !== null && (
              <Text style={{ fontSize: 13, color: '#EF4444' }}>
                {h.error}
              </Text>
            )}
            {h.a === null && h.error === null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#94A3B8' : '#64748B',
                  }}
                >
                  Thinking...
                </Text>
              </View>
            )}
          </Card>
        ))}
    </View>
  );
}
