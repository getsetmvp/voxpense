import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

export function Header({
  title,
  back = true,
  right,
}: {
  title?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const { tokens } = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
      }}
    >
      {back ? (
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
          }}
        >
          <ArrowLeft size={20} color={tokens.ink} />
        </Pressable>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text style={{ fontWeight: '600', fontSize: 14, color: tokens.ink }}>{title}</Text>
      <View style={{ minWidth: 36, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
