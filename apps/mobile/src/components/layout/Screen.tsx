import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type Props = ViewProps & {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function Screen({ children, style, edges, ...rest }: Props) {
  const { tokens } = useTheme();
  return (
    <SafeAreaView
      edges={edges ?? ['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: tokens.bg }}
    >
      <View style={[{ flex: 1 }, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
