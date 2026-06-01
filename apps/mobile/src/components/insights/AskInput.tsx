// AI Ask surface — pixel-match for mockup screens 15a (empty + suggestions)
// and 15b (live conversation w/ chat bubbles).
//
// Surface used inside the Insights tab Ask card. Renders:
//   - Suggested question chips (visible only when no history)
//   - Inline conversation: user bubble (brand) + AI bubble (glass)
//   - Bottom composer: glass-strong pill input + circular send/mic button
//
// Calls ai.ask({ question, from, to }) — props supply the window.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ai } from '../../lib/endpoints';

interface AskInputProps {
  from: string;
  to: string;
}

interface Turn {
  q: string;
  a: string | null;
  error: string | null;
}

const SUGGESTIONS = [
  'How much office last month?',
  'Compare May vs April',
  'Where can I save?',
  'Top 5 merchants this month',
];

export function AskInput({ from, to }: AskInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);

  const askNow = useCallback(
    async (question: string) => {
      const q = question.trim();
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
    },
    [submitting, history.length, from, to],
  );

  const submit = useCallback(() => askNow(text), [askNow, text]);

  // Colors
  const inkPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const inkSecondary = isDark ? '#94A3B8' : '#64748B';
  const inkPlaceholder = isDark ? '#64748B' : '#94A3B8';
  const aiBubbleBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const aiBubbleBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)';
  const composerBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)';
  const composerBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)';

  const isEmpty = history.length === 0;

  return (
    <View style={{ gap: 12 }}>
      {/* Empty state: hero + suggested questions */}
      {isEmpty && (
        <View className="items-center pt-2 pb-4" style={{ gap: 12 }}>
          <View
            className="items-center justify-center"
            style={HERO_ICON_STYLE}
          >
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </View>
          <Text
            className="text-base font-bold text-center"
            style={{ color: inkPrimary }}
          >
            Ask me anything
          </Text>
          <Text
            className="text-[13px] text-center"
            style={{ color: inkSecondary, maxWidth: 260 }}
          >
            Get insights about your spending in plain English.
          </Text>
          <View className="w-full mt-2" style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => askNow(s)}
                disabled={submitting}
                style={[
                  SUGGESTION_STYLE,
                  {
                    backgroundColor: chipBg,
                    borderColor: chipBorder,
                  },
                ]}
              >
                <Text className="text-[13px]" style={{ color: inkPrimary }}>
                  💡 {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Conversation */}
      {!isEmpty && (
        <View style={{ gap: 12 }}>
          {history.map((h, i) => (
            <View key={`${i}-${h.q.slice(0, 12)}`} style={{ gap: 8 }}>
              {/* User bubble — right-aligned, brand fill */}
              <View className="items-end">
                <View style={USER_BUBBLE_STYLE}>
                  <Text className="text-white text-[14px]">{h.q}</Text>
                </View>
              </View>

              {/* AI bubble — left-aligned with avatar */}
              <View className="flex-row" style={{ gap: 8 }}>
                <View style={AVATAR_STYLE}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
                <View
                  style={[
                    AI_BUBBLE_STYLE,
                    {
                      backgroundColor: aiBubbleBg,
                      borderColor: aiBubbleBorder,
                    },
                  ]}
                >
                  {h.a !== null ? (
                    <Text
                      className="text-[14px] leading-relaxed"
                      style={{ color: inkPrimary }}
                    >
                      {h.a}
                    </Text>
                  ) : h.error !== null ? (
                    <Text className="text-[13px] text-[#EF4444]">
                      {h.error}
                    </Text>
                  ) : (
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <ActivityIndicator
                        size="small"
                        color={isDark ? '#60A5FA' : '#3B82F6'}
                      />
                      <Text
                        className="text-[13px]"
                        style={{ color: inkSecondary }}
                      >
                        Thinking…
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Composer — pill input + circular send */}
      <View
        className="flex-row items-center px-3 py-2"
        style={{
          gap: 8,
          borderRadius: 999,
          backgroundColor: composerBg,
          borderWidth: 1,
          borderColor: composerBorder,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask anything..."
          placeholderTextColor={inkPlaceholder}
          onSubmitEditing={submit}
          returnKeyType="send"
          blurOnSubmit
          style={{
            flex: 1,
            fontSize: 14,
            color: inkPrimary,
            paddingHorizontal: 8,
            paddingVertical: 6,
          }}
        />
        <Pressable
          onPress={submit}
          disabled={submitting || !text.trim()}
          style={[
            SEND_BTN_STYLE,
            { opacity: submitting || !text.trim() ? 0.55 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name={text.trim() ? 'send' : 'mic'}
              size={18}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

// STATIC array-form styles — layout-bearing Pressables.

const HERO_ICON_STYLE = {
  width: 64,
  height: 64,
  borderRadius: 20,
  backgroundColor: '#3B82F6',
  shadowColor: '#3B82F6',
  shadowOpacity: 0.4,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const SUGGESTION_STYLE = {
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 16,
  borderWidth: 1,
};

const USER_BUBBLE_STYLE = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 22,
  borderTopRightRadius: 6,
  maxWidth: 280,
};

const AVATAR_STYLE = {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#3B82F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const AI_BUBBLE_STYLE = {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 22,
  borderTopLeftRadius: 6,
  borderWidth: 1,
  flexShrink: 1,
  maxWidth: 270,
};

const SEND_BTN_STYLE = {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: '#3B82F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
