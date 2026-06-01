// Voice capture (mockup 08-09). Dark fullscreen sheet, big mic glyph,
// animated waveform bars (static random), transcript text, Done/Retry/Cancel.

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Check, Keyboard, Mic, RotateCcw, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useToast } from '../../src/components/ui/Toast';
import { useVoiceTranscript } from '../../src/hooks/capture/useVoiceTranscript';
import { ai } from '../../src/lib/endpoints';

export default function VoiceCapture() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status, transcript, errorMessage, start, stop, reset } =
    useVoiceTranscript({ lang: 'en-IN' });
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    void start();
    return () => {
      try {
        stop();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = status === 'listening' || status === 'requesting';
  const isError = status === 'error' || status === 'denied';

  const onDone = async () => {
    stop();
    const text = transcript.trim();
    if (!text) {
      toast.show("Didn't catch that — try again", 'bad');
      return;
    }
    setParsing(true);
    try {
      const parsed = await ai.parseExpense({
        transcript: text,
        locale: 'en-IN',
      });
      router.replace({
        pathname: '/(capture)/confirm',
        params: {
          source: 'voice',
          transcript: text,
          amount: parsed.amount ?? '',
          currency: parsed.currency ?? '',
          merchant: parsed.merchant ?? '',
          note: parsed.note ?? '',
          occurredAt: parsed.occurredAt ?? '',
          categoryHint: parsed.category_hint ?? '',
        },
      });
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : 'AI parse failed',
        'bad',
      );
    } finally {
      setParsing(false);
    }
  };

  const onCancel = () => {
    stop();
    router.back();
  };

  const onRetry = () => {
    stop();
    reset();
    void start();
  };

  const onKeyboard = () => {
    stop();
    router.replace('/(capture)/manual');
  };

  // Static random waveform bars (visual only).
  const bars = useMemo(
    () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 32) + 6),
    [],
  );

  const inkInverse = tokens.inkInverse;

  return (
    <Screen edges={['top']} style={{ backgroundColor: tokens.ink }}>
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          paddingTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={onCancel} style={CIRCLE_36}>
          <X size={20} color={inkInverse} />
        </Pressable>
        <View
          style={{
            backgroundColor: `${tokens.bad}33`,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: tokens.bad,
            }}
          />
          <Text style={{ color: tokens.bad, fontSize: 12, fontWeight: '500' }}>
            {isListening ? 'Recording' : isError ? 'Error' : 'Idle'}
          </Text>
        </View>
        <Pressable onPress={onKeyboard} style={CIRCLE_36}>
          <Keyboard size={20} color={inkInverse} />
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: tokens.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mic size={64} color="#FFFFFF" />
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: 3,
            alignItems: 'flex-end',
            marginTop: 40,
            height: 36,
          }}
        >
          {bars.map((h, i) => (
            <View
              key={i}
              style={{
                width: 3,
                height: h,
                backgroundColor: tokens.brand,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
        <Text
          style={{
            color: inkInverse,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            marginTop: 32,
            maxWidth: 280,
          }}
        >
          {transcript ||
            (isError
              ? errorMessage ?? 'Could not hear that — tap retry'
              : 'Listening…')}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 12 }}>
          Tap done to save · retry to start over
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 32,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Pressable onPress={onRetry} style={SIDE_BTN('rgba(255,255,255,0.1)')}>
          <RotateCcw size={20} color={inkInverse} />
        </Pressable>
        <Pressable
          onPress={onDone}
          disabled={parsing}
          style={{
            paddingHorizontal: 24,
            height: 48,
            borderRadius: 16,
            backgroundColor: inkInverse,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            opacity: parsing ? 0.7 : 1,
          }}
        >
          {parsing ? (
            <ActivityIndicator color={tokens.ink} />
          ) : (
            <Check size={18} color={tokens.ink} />
          )}
          <Text style={{ color: tokens.ink, fontWeight: '700' }}>Done</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={SIDE_BTN(`${tokens.bad}33`)}>
          <X size={20} color={tokens.bad} />
        </Pressable>
      </View>
    </Screen>
  );
}

// Static layout-bearing Pressable styles.
const CIRCLE_36 = {
  width: 36,
  height: 36,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const SIDE_BTN = (bg: string) =>
  ({
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
  }) as const;
