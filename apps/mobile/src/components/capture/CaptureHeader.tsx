// Top bar for capture screens: back arrow + centered title + close (X).
// Stays separate from the glass <Screen> so we can keep it lightweight and
// reuse it on dark camera-overlay screens too.

import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CaptureHeaderProps {
  title?: string;
  /** When true, render the back + close buttons in white (used over camera/voice scrim). */
  invert?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  hideBack?: boolean;
  rightAccessory?: React.ReactNode;
}

export function CaptureHeader({
  title,
  invert,
  onClose,
  onBack,
  hideBack,
  rightAccessory,
}: CaptureHeaderProps) {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const iconBg = invert
    ? 'rgba(255,255,255,0.18)'
    : isDark
      ? '#1F2937'
      : '#F1F4F8';
  const iconColor = invert ? '#FFFFFF' : isDark ? '#F8FAFC' : '#0F172A';
  const titleColor = invert ? '#FFFFFF' : isDark ? '#F8FAFC' : '#0F172A';

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const handleClose = () => {
    if (onClose) return onClose();
    router.dismissAll();
    router.replace('/(tabs)/home');
  };

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {hideBack ? (
        <View style={{ width: 40 }} />
      ) : (
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={iconColor} />
        </Pressable>
      )}

      {title ? (
        <Text style={{ fontSize: 16, fontWeight: '600', color: titleColor }}>
          {title}
        </Text>
      ) : (
        <View />
      )}

      {rightAccessory ?? (
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={22} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}
