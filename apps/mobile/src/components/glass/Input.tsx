// Glass text input. Label + helper + error states.

import { forwardRef, ReactNode } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import { radii } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, helper, error, leftIcon, rightIcon, style, ...rest }, ref) => {
    const scheme = useColorScheme() ?? 'light';
    const isDark = scheme === 'dark';
    return (
      <View style={{ width: '100%' }}>
        {label && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              marginBottom: 6,
              color: isDark ? '#94A3B8' : '#475569',
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={{
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: error ? '#EF4444' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.7)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
          }}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            style={[
              {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: leftIcon || rightIcon ? 8 : 0,
                fontSize: 15,
                color: isDark ? '#F8FAFC' : '#0F172A',
              },
              style,
            ]}
            {...rest}
          />
          {rightIcon}
        </View>
        {(error || helper) && (
          <Text
            style={{
              fontSize: 12,
              marginTop: 6,
              color: error ? '#EF4444' : isDark ? '#64748B' : '#94A3B8',
            }}
          >
            {error ?? helper}
          </Text>
        )}
      </View>
    );
  },
);
Input.displayName = 'Input';
