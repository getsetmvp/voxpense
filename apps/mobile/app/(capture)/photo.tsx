// Screen 12. PhotoCaptureModal — pixel-match rebuild of mockup 12.
//
// Layout:
//   - Edge-to-edge full-bleed camera viewfinder (black bg)
//   - Top row: close (X) left, flash toggle right (white-on-black/15)
//   - Center: 192x256 frame guide with white corner brackets
//   - Bottom row: gallery placeholder (left, dimmed) · shutter (white ring) · flip-camera (right)
//   - On shutter: capture base64 → POST /ai/parse-receipt → replace to /(capture)/confirm
//
// Spec mandates direct submit on shutter (no preview gate) — keep flow tight.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen, Button } from '../../src/components/glass';
import { ai, type ParsedReceipt } from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';

const FRAME_W = 192;
const FRAME_H = 256;

type Phase = 'framing' | 'uploading' | 'error';

export default function PhotoCaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('framing');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [facing, setFacing] = useState<CameraType>('back');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-request permission once on mount.
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current || phase !== 'framing') return;
    setPhase('uploading');
    setErrorMsg(null);
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: false,
      });
      if (!pic?.base64) {
        setErrorMsg('Camera returned no image. Try again.');
        setPhase('error');
        return;
      }
      const parsed: ParsedReceipt = await ai.parseReceipt({
        image: { data: pic.base64, mime: 'image/jpeg' },
      });
      const payload = JSON.stringify({
        source: 'photo' as const,
        parsed,
      });
      router.replace({
        pathname: '/(capture)/confirm',
        params: { source: 'photo', payload },
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not read receipt. Try again.';
      setErrorMsg(msg);
      setPhase('error');
    }
  }, [phase, router]);

  const handleClose = useCallback(() => {
    router.dismissAll();
    router.replace('/(tabs)/home');
  }, [router]);

  // ── permission states ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <Screen safe={false}>
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black" />
        <SafeAreaView className="flex-1 px-6">
          <View className="flex-1 items-center justify-center" style={{ gap: 16 }}>
            <View
              className="items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: 'rgba(239,68,68,0.18)',
              }}
            >
              <Ionicons name="camera-outline" size={44} color="#FCA5A5" />
            </View>
            <Text className="text-white text-xl font-bold text-center">
              Camera permission required
            </Text>
            <Text className="text-white/75 text-sm text-center leading-5">
              Grant camera access to snap receipts. Photos only leave your phone for the AI parse call.
            </Text>
            <View className="flex-row mt-2" style={{ gap: 12 }}>
              <Button variant="ghost" onPress={handleClose}>Cancel</Button>
              <Button onPress={() => void requestPermission()}>Grant access</Button>
            </View>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  // ── camera viewfinder ─────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={CAMERA_FILL}
        facing={facing}
        flash={flash}
      />

      <SafeAreaView className="flex-1">
        {/* Top bar */}
        <View
          className="flex-row items-center justify-between px-5 pt-2"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={handleClose}
            style={ROUND_BTN}
            disabled={phase === 'uploading'}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle flash"
            onPress={() =>
              setFlash((cur) => (cur === 'off' ? 'on' : cur === 'on' ? 'auto' : 'off'))
            }
            style={ROUND_BTN}
            disabled={phase === 'uploading'}
          >
            <Ionicons
              name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* Center: frame guide / uploading / error */}
        <View className="flex-1 items-center justify-center">
          {phase === 'framing' && <FrameGuide />}

          {phase === 'uploading' && (
            <View
              className="items-center px-5 py-4"
              style={{
                gap: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.55)',
              }}
            >
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold">
                Reading receipt…
              </Text>
            </View>
          )}

          {phase === 'error' && (
            <View
              className="items-center mx-6 px-5 py-4"
              style={{
                gap: 12,
                borderRadius: 20,
                backgroundColor: 'rgba(239,68,68,0.9)',
              }}
            >
              <Text className="text-white text-[15px] font-bold text-center">
                {errorMsg ?? 'Something went wrong.'}
              </Text>
              <View className="flex-row" style={{ gap: 10 }}>
                <Button variant="ghost" onPress={handleClose}>Cancel</Button>
                <Button onPress={() => setPhase('framing')}>Retake</Button>
              </View>
            </View>
          )}
        </View>

        {/* Bottom row */}
        <View
          className="flex-row items-center justify-between px-6 pb-8"
        >
          <View style={SQUARE_BTN}>
            <Ionicons name="image" size={22} color="#FFFFFF" />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={handleShutter}
            disabled={phase !== 'framing'}
            style={SHUTTER_BTN}
          >
            <View style={SHUTTER_INNER} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={() => setFacing((cur) => (cur === 'back' ? 'front' : 'back'))}
            style={SQUARE_BTN}
            disabled={phase !== 'framing'}
          >
            <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const CAMERA_FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const ROUND_BTN = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.2)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const SQUARE_BTN = {
  width: 48,
  height: 48,
  borderRadius: 16,
  backgroundColor: 'rgba(255,255,255,0.15)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const SHUTTER_BTN = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#FFFFFF',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const SHUTTER_INNER = {
  width: 64,
  height: 64,
  borderRadius: 32,
  borderWidth: 4,
  borderColor: '#000',
};

function FrameGuide() {
  return (
    <View
      className="items-center justify-center"
      style={{ width: FRAME_W, height: FRAME_H }}
    >
      <Corner top left />
      <Corner top right />
      <Corner bottom left />
      <Corner bottom right />
      <Text className="text-white text-[13px] font-semibold text-center leading-relaxed px-4">
        Frame the receipt{'\n'}here
      </Text>
    </View>
  );
}

function Corner({
  top,
  bottom,
  left,
  right,
}: {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: top ? -4 : undefined,
        bottom: bottom ? -4 : undefined,
        left: left ? -4 : undefined,
        right: right ? -4 : undefined,
        width: 32,
        height: 32,
        borderColor: '#FFFFFF',
        borderTopWidth: top ? 4 : 0,
        borderBottomWidth: bottom ? 4 : 0,
        borderLeftWidth: left ? 4 : 0,
        borderRightWidth: right ? 4 : 0,
        borderTopLeftRadius: top && left ? 8 : 0,
        borderTopRightRadius: top && right ? 8 : 0,
        borderBottomLeftRadius: bottom && left ? 8 : 0,
        borderBottomRightRadius: bottom && right ? 8 : 0,
      }}
    />
  );
}
