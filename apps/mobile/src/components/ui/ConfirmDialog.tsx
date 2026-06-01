import { Modal, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function ConfirmDialog({
  visible,
  title,
  message,
  destructive = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 320,
            borderRadius: 20,
            backgroundColor: tokens.surface,
            padding: 20,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.ink }}>{title}</Text>
          {message ? <Text style={{ fontSize: 13, color: tokens.muted }}>{message}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: tokens.ink, fontWeight: '600' }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                backgroundColor: destructive ? tokens.bad : tokens.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
