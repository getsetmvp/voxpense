import { View, Pressable } from 'react-native';
import { Camera, Mic } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

export function FabStack() {
  const { tokens } = useTheme();
  const router = useRouter();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', right: 16, bottom: 96, gap: 12, alignItems: 'center' }}
    >
      <Pressable
        onPress={() => router.push('/(capture)/photo')}
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: tokens.surface,
          borderWidth: 1,
          borderColor: tokens.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Camera size={22} color={tokens.ink} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/(capture)/voice')}
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          backgroundColor: tokens.brand,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: tokens.brand,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Mic size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
