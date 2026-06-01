// Photo capture (mockup 10-11). Camera preview fullscreen + shutter ring.
// On snap: base64 → ai.parseReceipt → navigate to /(capture)/confirm.

import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Image as ImageIcon, X, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useToast } from '../../src/components/ui/Toast';
import { ai } from '../../src/lib/endpoints';

export default function PhotoCapture() {
  const { tokens } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const camRef = useRef<CameraView | null>(null);
  const [perm, request] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!perm) return;
    if (!perm.granted) void request();
  }, [perm, request]);

  const onSnap = async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      const pic = await camRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });
      if (!pic?.uri) {
        toast.show('Capture failed', 'bad');
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(pic.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const parsed = await ai.parseReceipt({
        image: { data: base64, mime: 'image/jpeg' },
      });
      router.replace({
        pathname: '/(capture)/confirm',
        params: {
          source: 'photo',
          amount: parsed.amount ?? '',
          currency: parsed.currency ?? '',
          merchant: parsed.merchant ?? '',
          note: parsed.note ?? '',
          occurredAt: parsed.occurredAt ?? '',
          categoryHint: parsed.category_hint ?? '',
        },
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Capture failed', 'bad');
    } finally {
      setBusy(false);
    }
  };

  if (!perm?.granted) {
    return (
      <Screen edges={['top']}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <ImageIcon size={48} color={tokens.muted} />
          <Text
            style={{
              color: tokens.ink,
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Camera access needed
          </Text>
          <Text
            style={{
              color: tokens.muted,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            VoxPense uses the camera to scan receipts.
          </Text>
          <Pressable
            onPress={request}
            style={{
              marginTop: 16,
              paddingHorizontal: 20,
              height: 44,
              borderRadius: 12,
              backgroundColor: tokens.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Grant camera
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 12, padding: 8 }}
          >
            <Text style={{ color: tokens.muted }}>Cancel</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View
        style={{
          height: 80,
          paddingHorizontal: 16,
          paddingTop: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color="#FFFFFF" />
        </Pressable>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Zap size={12} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
            Auto
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <CameraView ref={camRef} style={{ flex: 1 }} facing="back" />
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 48,
          paddingTop: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <Pressable
          onPress={() => router.replace('/(capture)/manual')}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={onSnap}
          disabled={busy}
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            borderWidth: 4,
            borderColor: tokens.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: '#FFFFFF',
              }}
            />
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
