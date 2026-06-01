import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Props = TextInputProps & {
  label?: string;
  errorText?: string;
};

export function Input({ label, errorText, style, ...rest }: Props) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '500',
            color: tokens.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={tokens.muted}
        style={[
          {
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errorText ? tokens.bad : tokens.border,
            backgroundColor: tokens.surface,
            paddingHorizontal: 14,
            color: tokens.ink,
            fontSize: 14,
          },
          style,
        ]}
        {...rest}
      />
      {errorText ? <Text style={{ fontSize: 12, color: tokens.bad }}>{errorText}</Text> : null}
    </View>
  );
}
