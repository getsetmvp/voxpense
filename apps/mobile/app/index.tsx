// Entry route. AuthGate in _layout handles redirection; we just render a
// splash placeholder while auth state hydrates.

import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';

export default function IndexRedirect() {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.bg,
      }}
    >
      <ActivityIndicator color={tokens.brand} />
    </View>
  );
}
