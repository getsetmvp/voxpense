import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Dots({ count, active }: { count: number; active: number }) {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 24 : 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: i === active ? tokens.brand : tokens.border,
          }}
        />
      ))}
    </View>
  );
}
