// Screen 12. PhotoCaptureModal — camera view w/ frame guide.
//
// Lifecycle:
//   - on mount: request camera permission
//   - tap shutter → expo-camera.takePictureAsync({ base64: true, quality 0.7 })
//   - freeze preview → "Use photo" or "Retake"
//   - on use → POST to /ai/parse-receipt → /(capture)/confirm
//
// No gallery picker yet (would require expo-image-picker — flagged in report).
// Downscale on capture via expo-camera's `quality` knob; image-manipulator
// also not installed, so we rely on JPEG quality only.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
  type FlashMode,
} from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/glass';
import { ai, type ParsedReceipt } from '../../src/lib/endpoints';
import { ApiError } from '../../src/lib/api';
import { radii } from '../../src/theme/tokens';

type Phase = 'permission' | 'framing' | 'preview' | 'uploading' | 'error';

const FRAME_W = 220;
const FRAME_H = 300;

export default function PhotoCaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('framing');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [picture, setPicture] = useState<CameraCapturedPicture | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-request permission once on mount (covers first launch).
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: false,
      });
      if (!pic) {
        setErrorMsg('Camera returned no image.');
        setPhase('error');
        return;
      }
      setPicture(pic);
      setPhase('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Capture failed.');
      setPhase('error');
    }
  }, []);

  const handleRetake = useCallback(() => {
    setPicture(null);
    setErrorMsg(null);
    setPhase('framing');
  }, []);

  const handleUse = useCallback(async () => {
    if (!picture?.base64) {
      setErrorMsg('Image data missing.');
      setPhase('error');
      return;
    }
    setPhase('uploading');
    setErrorMsg(null);
    try {
      const parsed: ParsedReceipt = await ai.parseReceipt({
        image: { data: picture.base64, mime: 'image/jpeg' },
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
  }, [picture, router]);

  // ── permission states ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', padding: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
            <Ionicons name="camera-outline" size={44} color="#FCA5A5" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
            Camera permission required
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Grant camera access to snap receipts. Photos never leave your phone except for the AI parse call.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button variant="ghost" onPress={() => router.back()}>Cancel</Button>
            <Button onPress={() => void requestPermission()}>Grant access</Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── camera viewfinder + preview ───────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {phase === 'preview' || phase === 'uploading' || (phase === 'error' && picture) ? (
        <Image
          source={{ uri: picture?.uri ?? '' }}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : (
        <CameraView
          ref={cameraRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          facing="back"
          flash={flash}
        />
      )}

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            {phase === 'preview' ? 'Use this photo?' : 'Capture receipt'}
          </Text>

          {phase === 'framing' ? (
            <Pressable
              onPress={() =>
                setFlash((cur) => (cur === 'off' ? 'on' : cur === 'on' ? 'auto' : 'off'))
              }
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons
                name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'}
                size={22}
                color="#FFFFFF"
              />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Center: frame guide while framing, status while uploading */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'framing' && <FrameGuide />}
          {phase === 'uploading' && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderRadius: radii.lg,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ActivityIndicator color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                Reading receipt...
              </Text>
            </View>
          )}
          {phase === 'error' && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderRadius: radii.lg,
                backgroundColor: 'rgba(239,68,68,0.85)',
                alignItems: 'center',
                gap: 8,
                marginHorizontal: 24,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
                {errorMsg ?? 'Something went wrong.'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {phase === 'framing' ? (
            <>
              <View style={{ width: 56 }} />
              <Pressable
                onPress={handleShutter}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                style={({ pressed }) => ({
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: '#000',
                  }}
                />
              </Pressable>
              <View style={{ width: 56 }} />
            </>
          ) : phase === 'preview' || phase === 'error' ? (
            <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleRetake}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: radii.lg,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Retake</Text>
              </Pressable>
              <Pressable
                onPress={handleUse}
                style={({ pressed }) => ({
                  flex: 2,
                  paddingVertical: 16,
                  borderRadius: radii.lg,
                  backgroundColor: '#3B82F6',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  Use photo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function FrameGuide() {
  return (
    <View
      style={{
        width: FRAME_W,
        height: FRAME_H,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* corner brackets */}
      <Corner top left />
      <Corner top right />
      <Corner bottom left />
      <Corner bottom right />
      <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
        Frame the receipt{'\n'}inside the box
      </Text>
    </View>
  );
}

function Corner({ top, bottom, left, right }: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: top ? -4 : undefined,
        bottom: bottom ? -4 : undefined,
        left: left ? -4 : undefined,
        right: right ? -4 : undefined,
        width: 28,
        height: 28,
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
