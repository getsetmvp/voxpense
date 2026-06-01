// Runtime wrapper for expo-speech-recognition.
//
// expo-speech-recognition is a third-party native module. It is fully present
// in dev-client builds and production APKs (compiled in via expo prebuild +
// the package's config plugin). It is NOT present in the Expo Go shell, since
// Expo Go ships a fixed set of native modules. Without this wrapper, opening
// the app on Expo Go errors with "Cannot find native module 'ExpoSpeechRecognition'".
//
// On Expo Go we return a no-op shim so screens render. On real builds we
// re-export the real module so behaviour is unchanged. `isVoiceRecognitionAvailable`
// lets UI surface a banner when running on the shim.

import Constants from 'expo-constants';

type Listener = (event: any) => void;

interface SpeechRecognitionModuleLike {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
}

type UseSpeechRecognitionEventFn = (eventName: string, listener: Listener) => void;

const isExpoGo = Constants.appOwnership === 'expo';

let realModule: SpeechRecognitionModuleLike | null = null;
let realUseEvent: UseSpeechRecognitionEventFn | null = null;

if (!isExpoGo) {
  try {
    // Dynamic require so the JS bundle on Expo Go never resolves the native binding.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition');
    realModule = mod.ExpoSpeechRecognitionModule ?? null;
    realUseEvent = mod.useSpeechRecognitionEvent ?? null;
  } catch {
    realModule = null;
    realUseEvent = null;
  }
}

const stubModule: SpeechRecognitionModuleLike = {
  async requestPermissionsAsync() {
    return { granted: false };
  },
  start() {
    // no-op
  },
  stop() {
    // no-op
  },
  abort() {
    // no-op
  },
};

const stubUseEvent: UseSpeechRecognitionEventFn = () => {
  // no listener registration in Expo Go
};

export const isVoiceRecognitionAvailable: boolean = !!realModule;

export const SpeechRecognitionModule: SpeechRecognitionModuleLike =
  realModule ?? stubModule;

export const useSpeechRecognitionEvent: UseSpeechRecognitionEventFn =
  realUseEvent ?? stubUseEvent;
