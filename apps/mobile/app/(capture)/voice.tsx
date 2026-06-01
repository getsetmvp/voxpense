// Screen 10. VoiceCaptureModal — pixel-match rebuild of mockup screens 10a/10b/10c.
//
// Layout:
//   - Edge-to-edge modal (no safe-area top inset, dark scrim covers the gradient)
//   - Top-right close (X) button
//   - Centered ring (glass-strong) containing brand mic disc
//   - Phase captions ("Tap to start" / "Listening..." / "AI is parsing...")
//   - Bottom-area glass card: TIP (idle) → TRANSCRIPT live (listening) → checklist (processing)
//
// Permission denial + parse error states inline with retry.

import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../src/components/glass';
import { MicButton } from '../../src/components/capture';
import { useVoiceTranscript } from '../../src/hooks/capture/useVoiceTranscript';
import { ai, type ParsedExpense } from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';

type Phase = 'recording' | 'parsing' | 'parse-error';

export default function VoiceCaptureScreen() {
  const router = useRouter();

  const { status, transcript, errorMessage, start, stop, reset } =
    useVoiceTranscript({ lang: 'en-IN' });

  const [phase, setPhase] = useState<Phase>('recording');
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');

  const isProcessing = phase === 'parsing';
  const showDenied = status === 'denied';
  const showError = status === 'error';

  const handleParse = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setPhase('parse-error');
        setParseError("Didn't catch that. Try again?");
        return;
      }
      setPhase('parsing');
      setParseError(null);
      setLastTranscript(trimmed);
      try {
        const parsed: ParsedExpense = await ai.parseExpense({
          transcript: trimmed,
          locale: 'en-IN',
        });
        const payload = JSON.stringify({
          source: 'voice' as const,
          transcript: trimmed,
          parsed,
        });
        router.replace({
          pathname: '/(capture)/confirm',
          params: { source: 'voice', payload },
        });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Network error. Try again.';
        setParseError(msg);
        setPhase('parse-error');
      }
    },
    [router],
  );

  const handleMicPress = useCallback(async () => {
    if (isProcessing) return;
    if (status === 'listening') {
      stop();
      const finalText = transcript.trim();
      // Allow the recognizer a beat to emit its final result.
      setTimeout(() => {
        handleParse(finalText);
      }, 150);
      return;
    }
    setPhase('recording');
    setParseError(null);
    await start();
  }, [status, transcript, stop, start, handleParse, isProcessing]);

  const handleRetry = useCallback(() => {
    if (lastTranscript) {
      void handleParse(lastTranscript);
      return;
    }
    reset();
    setParseError(null);
    setPhase('recording');
  }, [lastTranscript, handleParse, reset]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleClose = useCallback(() => {
    stop();
    router.dismissAll();
    router.replace('/(tabs)/home');
  }, [router, stop]);

  const micState: 'idle' | 'listening' | 'processing' = isProcessing
    ? 'processing'
    : status === 'listening'
      ? 'listening'
      : 'idle';

  const captionPrimary = isProcessing
    ? 'AI is parsing...'
    : status === 'listening'
      ? 'Listening...'
      : status === 'requesting'
        ? 'Starting mic...'
        : 'Tap to start';

  const captionSecondary = isProcessing
    ? 'extracting amount, category, merchant'
    : status === 'listening'
      ? 'tap mic to stop'
      : 'or hold for push-to-talk';

  return (
    <Screen safe={false}>
      {/* Dark scrim over the gradient bg (matches mockup bg-black/60 + backdrop-blur). */}
      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 bottom-0 bg-black/60"
      />

      {/* Top-right close X (no back button on voice modal — matches mockup 10a). */}
      <View className="pt-14 px-5 flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
          style={STYLES.closeBtn}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="flex-1 items-center pt-6 px-6">
        {showDenied ? (
          <PermissionDeniedView
            message={errorMessage ?? 'Mic permission required'}
            onOpenSettings={openSettings}
            onRetry={() => {
              reset();
              void start();
            }}
          />
        ) : (
          <>
            <MicButton
              state={micState}
              onPress={handleMicPress}
              disabled={isProcessing}
            />

            <Text className="text-white text-xl font-semibold mt-7">
              {captionPrimary}
            </Text>
            <Text className="text-white/70 text-[13px] mt-1">
              {captionSecondary}
            </Text>

            <View className="mt-10 w-full">
              {micState === 'listening' ? (
                <TranscriptCard text={transcript} />
              ) : micState === 'processing' ? (
                <ProcessingChecklist />
              ) : (
                <TipCard />
              )}
            </View>

            {phase === 'parse-error' && (
              <View className="mt-4 w-full items-center" style={{ gap: 10 }}>
                <Text className="text-[#FCA5A5] text-[13px] text-center">
                  {parseError ?? 'Something went wrong.'}
                </Text>
                <View className="flex-row" style={{ gap: 10 }}>
                  <Button variant="ghost" onPress={() => router.back()}>Cancel</Button>
                  <Button onPress={handleRetry}>Retry</Button>
                </View>
              </View>
            )}

            {showError && phase !== 'parse-error' && (
              <View className="mt-4 w-full items-center" style={{ gap: 10 }}>
                <Text className="text-[#FCA5A5] text-[13px] text-center">
                  {errorMessage ?? 'Could not hear you. Try again.'}
                </Text>
                <Button onPress={() => { reset(); void start(); }}>Try again</Button>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const STYLES = {
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderRadius: 20,
  },
};

function TipCard() {
  return (
    <View
      className="self-center px-4 py-3"
      style={[STYLES.glassCard, { maxWidth: 300 }]}
    >
      <Text className="text-white/80 text-[11px] font-semibold tracking-widest mb-1">
        TIP
      </Text>
      <Text className="text-white text-[13px] leading-[18px]">
        Speak naturally. AI parses amount, merchant, category.
      </Text>
    </View>
  );
}

function TranscriptCard({ text }: { text: string }) {
  return (
    <View className="px-5 py-4" style={STYLES.glassCard}>
      <Text className="text-white/80 text-[11px] font-semibold tracking-widest mb-2">
        TRANSCRIPT
      </Text>
      <Text className="text-white text-[14px] leading-relaxed">
        {text || '…'}
        <Text className="text-white/80">{' ▍'}</Text>
      </Text>
    </View>
  );
}

function ProcessingChecklist() {
  return (
    <View className="px-5 py-4" style={[STYLES.glassCard, { gap: 8 }]}>
      <ChecklistRow icon="checkmark" color="#10B981" label="Amount detected" />
      <ChecklistRow icon="checkmark" color="#10B981" label="Merchant identified" />
      <ChecklistRow icon="sync" color="#FBBF24" label="Categorizing" spinning />
    </View>
  );
}

function ChecklistRow({
  icon,
  color,
  label,
  spinning,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  spinning?: boolean;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text
        className={spinning ? 'text-white/80 text-[13px]' : 'text-white text-[13px]'}
      >
        {label}
      </Text>
    </View>
  );
}

interface PermissionDeniedViewProps {
  message: string;
  onOpenSettings: () => void;
  onRetry: () => void;
}

function PermissionDeniedView({ message, onOpenSettings, onRetry }: PermissionDeniedViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-6" style={{ gap: 16 }}>
      <View
        className="items-center justify-center"
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(239,68,68,0.18)',
        }}
      >
        <Ionicons name="mic-off" size={44} color="#FCA5A5" />
      </View>
      <Text className="text-white text-xl font-bold text-center">
        Mic permission required
      </Text>
      <Text className="text-white/75 text-sm text-center leading-5">
        {message}
        {'\n'}
        Grant microphone + speech recognition access to dictate expenses.
      </Text>
      <View className="flex-row mt-2" style={{ gap: 12 }}>
        <Button variant="ghost" onPress={onRetry}>Try again</Button>
        <Button onPress={onOpenSettings}>Open settings</Button>
      </View>
    </View>
  );
}
