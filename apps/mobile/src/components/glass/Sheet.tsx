// Bottom sheet wrapper using React Native Modal + BlurView backdrop.
// Lightweight (no extra deps) — covers MVP need for confirm sheets,
// pickers, AI-parsed expense preview, etc.

import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  View,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, shadows } from '../../theme/tokens';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissable?: boolean;
}

export function Sheet({ open, onClose, children, dismissable = true }: SheetProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={dismissable ? onClose : undefined}
    >
      <Pressable
        onPress={dismissable ? onClose : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <BlurView
          intensity={20}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={{ position: 'absolute', inset: 0 }}
        />
        <Pressable onPress={() => {}} style={{ overflow: 'hidden' }}>
          <SafeAreaView
            edges={['bottom']}
            style={{
              backgroundColor: scheme === 'dark' ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.96)',
              borderTopLeftRadius: radii['2xl'],
              borderTopRightRadius: radii['2xl'],
              ...shadows.card,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                marginTop: 8,
                marginBottom: 4,
                backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
              }}
            />
            <View style={{ padding: 20, paddingBottom: 28 }}>{children}</View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
