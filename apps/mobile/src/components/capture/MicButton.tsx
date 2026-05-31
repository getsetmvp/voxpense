// Hero mic button for VoiceCaptureModal.
//
// Renders an outer glass ring (300px target) with the brand-colored mic disc
// inside. When `listening`, the outer ring pulses outward via Reanimated and
// a 9-bar waveform animates inside the disc. Tap-to-toggle (matches mockup 10b
// where the mic IS the stop button while listening).

import { useEffect } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { palette, shadows } from '../../theme/tokens';

type MicState = 'idle' | 'listening' | 'processing';

interface MicButtonProps {
  state: MicState;
  onPress: () => void;
  disabled?: boolean;
}

const RING_SIZE = 224;
const DISC_SIZE = 128;
const BAR_COUNT = 9;

export function MicButton({ state, onPress, disabled }: MicButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
    return () => {
      cancelAnimation(pulse);
    };
  }, [isListening, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.45 }],
  }));

  const ringBorderColor =
    scheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.35)';
  const ringBg =
    scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop recording' : 'Start recording'}
      style={({ pressed }) => ({
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ringBg,
        borderWidth: 1,
        borderColor: ringBorderColor,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* Outer pulse ring (animated when listening) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: 3,
            borderColor: palette.brand,
          },
          pulseStyle,
        ]}
      />

      {/* Inner brand disc */}
      <View
        style={{
          width: DISC_SIZE,
          height: DISC_SIZE,
          borderRadius: DISC_SIZE / 2,
          backgroundColor: palette.brand,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.fab,
        }}
      >
        {isListening ? (
          <Waveform />
        ) : isProcessing ? (
          <Ionicons name="sparkles" size={44} color="#FFFFFF" />
        ) : (
          <Ionicons name="mic" size={56} color="#FFFFFF" />
        )}
      </View>
    </Pressable>
  );
}

// 9-bar live waveform. Driven by a single shared value with per-bar phase
// offsets — no native event subscription, so no permissions-heavy audio
// metering on Android. Good enough visually + zero new deps.
function Waveform() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(t);
    };
  }, [t]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        gap: 4,
      }}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Bar key={i} index={i} progress={t} />
      ))}
    </View>
  );
}

interface BarProps {
  index: number;
  progress: Animated.SharedValue<number>;
}

function Bar({ index, progress }: BarProps) {
  // Each bar phases the sine wave differently so the bars feel "alive" without
  // any audio input wired in. Center bars get more amplitude than edges.
  const distanceFromCenter = Math.abs(index - (BAR_COUNT - 1) / 2);
  const baseAmp = 1 - distanceFromCenter / BAR_COUNT;
  const phase = (index / BAR_COUNT) * Math.PI * 2;

  const style = useAnimatedStyle(() => {
    const wave = Math.sin(progress.value * Math.PI * 2 + phase);
    const amp = 0.4 + baseAmp * (0.6 + wave * 0.4);
    return { height: 8 + amp * 28 };
  });

  return (
    <Animated.View
      style={[
        {
          width: 4,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
        },
        style,
      ]}
    />
  );
}
