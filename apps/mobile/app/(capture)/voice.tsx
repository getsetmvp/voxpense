// Screen 10. VoiceCaptureModal — THE hero flow.
//
// Lifecycle:
//   - on mount: prime mic + STT permission via expo-speech-recognition
//   - tap mic to start recording → live partial transcript
//   - tap mic again to stop → POST transcript to /ai/parse-expense
//   - on success → router.replace to /(capture)/confirm with payload
//   - on permission denial / parse failure → inline error w/ retry
//
// Design: dark scrim over Screen background. Big animated mic disc with pulse
// ring + waveform when listening. Live transcript pill below.

import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { Screen, Button } from '../../src/components/glass';
import { CaptureHeader, MicButton } from '../../src/components/capture';
import { useVoiceTranscript } from '../../src/hooks/capture/useVoiceTranscript';
import { ai, type ParsedExpense } from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';
import { radii } from '../../src/theme/tokens';

type Phase = 'recording' | 'parsing' | 'parse-error';

export default function VoiceCaptureScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const isDark = scheme === 'dark';

  const { status, transcript, errorMessage, start, stop, reset } =
    useVoiceTranscript({ lang: 'en-IN' });

  const [phase, setPhase] = useState<Phase>('recording');
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');

  const isListening = status === 'listening' || status === 'requesting';
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
      // Stop and parse whatever we have so far.
      stop();
      const finalText = transcript.trim();
      // Give the recognizer ~150ms to emit a final result before we send.
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

  const micState = isProcessing
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
    ? 'extracting amount, merchant, category'
    : status === 'listening'
      ? 'tap mic to stop'
      : 'Speak naturally. AI parses the rest.';

  return (
    <Screen>
      {/* Dark scrim over the gradient background for contrast */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      />

      <CaptureHeader invert hideBack />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 24, paddingTop: 24 }}>
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
            <Text
              style={{
                marginTop: 28,
                fontSize: 20,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {captionPrimary}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {captionSecondary}
            </Text>

            <TranscriptCard text={transcript} listening={status === 'listening'} dark={isDark} />

            {phase === 'parse-error' && (
              <View style={{ marginTop: 16, width: '100%', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>
                  {parseError ?? 'Something went wrong.'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button variant="ghost" onPress={() => router.back()}>Cancel</Button>
                  <Button onPress={handleRetry}>Retry</Button>
                </View>
              </View>
            )}

            {showError && phase !== 'parse-error' && (
              <View style={{ marginTop: 16, width: '100%', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>
                  {errorMessage ?? 'Could not hear you. Try again.'}
                </Text>
                <Button onPress={() => { reset(); void start(); }}>Try again</Button>
              </View>
            )}

            {isProcessing && (
              <View style={{ marginTop: 24 }}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

interface TranscriptCardProps {
  text: string;
  listening: boolean;
  dark: boolean;
}

function TranscriptCard({ text, listening, dark }: TranscriptCardProps) {
  if (!text && !listening) {
    return (
      <View style={{ marginTop: 40, width: '100%' }}>
        <View
          style={{
            borderRadius: radii.lg,
            overflow: 'hidden',
            alignSelf: 'center',
            maxWidth: 300,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        >
          <BlurView intensity={30} tint="dark" style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 4 }}>
              TIP
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 18 }}>
              Speak naturally. AI parses amount, merchant, category.
            </Text>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 36, width: '100%' }}>
      <View
        style={{
          borderRadius: radii.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
      >
        <BlurView intensity={30} tint="dark" style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 8 }}>
            TRANSCRIPT
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 24 }}>
            {text || (listening ? '…' : '')}
            {listening && (
              <Text style={{ color: '#FFFFFF', opacity: 0.6 }}>{' ▍'}</Text>
            )}
          </Text>
        </BlurView>
      </View>
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(239,68,68,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="mic-off" size={44} color="#FCA5A5" />
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
        Mic permission required
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {message} {'\n'}Grant microphone + speech recognition access to dictate expenses.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <Pressable onPress={onRetry}>
          <Button variant="ghost" onPress={onRetry}>Try again</Button>
        </Pressable>
        <Button onPress={onOpenSettings}>Open settings</Button>
      </View>
    </View>
  );
}
