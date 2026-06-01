import { View, type ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Card({ style, children, ...rest }: ViewProps) {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: 16,
          backgroundColor: tokens.surface,
          borderWidth: 1,
          borderColor: tokens.border,
          padding: 16,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
