// Voice transcript hook. Wraps expo-speech-recognition with a tiny state machine.
//
// States:
//   idle       — not yet started this session
//   requesting — permission prompt in flight
//   denied     — user refused mic/STT permission
//   listening  — actively transcribing
//   stopped    — finished cleanly with a final transcript
//   error      — recognizer surfaced an error code
//
// Consumers call `start()` / `stop()` / `reset()`. The hook coalesces partial
// and final results into a single `transcript` string and surfaces the latest
// error message. Cleanup on unmount aborts the recognizer.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SpeechRecognitionModule as ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '../../lib/speechRecognition';

export type VoiceStatus =
  | 'idle'
  | 'requesting'
  | 'denied'
  | 'listening'
  | 'stopped'
  | 'error';

interface UseVoiceTranscriptOptions {
  /** BCP-47 locale tag. Defaults to en-IN. */
  lang?: string;
  /** Disable interim updates if the platform is slow. Default true. */
  interimResults?: boolean;
}

interface UseVoiceTranscriptResult {
  status: VoiceStatus;
  transcript: string;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useVoiceTranscript(
  options: UseVoiceTranscriptOptions = {},
): UseVoiceTranscriptResult {
  const { lang = 'en-IN', interimResults = true } = options;

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Persist the latest transcript across rerenders so `stop` can settle it.
  const transcriptRef = useRef('');

  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
  });

  useSpeechRecognitionEvent('end', () => {
    setStatus((prev) => (prev === 'error' || prev === 'denied' ? prev : 'stopped'));
  });

  useSpeechRecognitionEvent('result', (event) => {
    const best = event.results[0]?.transcript ?? '';
    if (!best) return;
    transcriptRef.current = best;
    setTranscript(best);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'aborted') return;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setStatus('denied');
      setErrorMessage(event.message || 'Permission denied');
      return;
    }
    setStatus('error');
    setErrorMessage(event.message || `Recognition error: ${event.error}`);
  });

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript('');
    transcriptRef.current = '';
    setStatus('requesting');
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setStatus('denied');
        setErrorMessage('Microphone permission denied');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults,
        continuous: true,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
      // Some platforms emit `start` after a beat; flip optimistically.
      setStatus('listening');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to start recognition',
      );
    }
  }, [lang, interimResults]);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Recognizer may not be running — ignore.
    }
  }, []);

  const reset = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // On unmount, hard-abort to avoid lingering native sessions.
  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  return { status, transcript, errorMessage, start, stop, reset };
}
