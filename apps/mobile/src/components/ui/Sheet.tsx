import { Modal, View, Pressable, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

type Props = ViewProps & {
  visible: boolean;
  onClose: () => void;
  heightPct?: number;
  children: ReactNode;
};

export function Sheet({ visible, onClose, heightPct = 70, children }: Props) {
  const { tokens } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <View
        style={{
          height: `${heightPct}%`,
          backgroundColor: tokens.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 20,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            backgroundColor: tokens.border,
            alignSelf: 'center',
            marginBottom: 12,
          }}
        />
        {children}
      </View>
    </Modal>
  );
}
