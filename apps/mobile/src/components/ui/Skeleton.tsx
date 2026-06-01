import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: `${tokens.muted}33`,
          borderRadius: 8,
          height: 14,
        },
        style,
      ]}
    />
  );
}
