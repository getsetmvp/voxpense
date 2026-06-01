// AuthField — flat input row for onboarding screens.
// Matches mockup 02/03: tiny label above, surf-l1 rounded pill (h-12), icon + input + optional right slot.

import { forwardRef, ReactNode } from 'react';
import {
  TextInput,
  TextInputProps,
  Text,
  View,
  useColorScheme,
} from 'react-native';

interface AuthFieldProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const AuthField = forwardRef<TextInput, AuthFieldProps>(
  ({ label, helper, error, leftIcon, rightSlot, style, ...rest }, ref) => {
    const scheme = useColorScheme() ?? 'light';
    const isDark = scheme === 'dark';
    const ink = isDark ? '#F8FAFC' : '#0F172A';
    const meta = isDark ? '#94A3B8' : '#64748B';
    const fieldBg = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)';

    return (
      <View style={{ width: '100%' }}>
        {label ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              marginBottom: 4,
              color: meta,
            }}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 48,
            borderRadius: 14,
            paddingHorizontal: 16,
            backgroundColor: fieldBg,
            borderWidth: error ? 1 : 0,
            borderColor: error ? '#EF4444' : 'transparent',
            gap: 8,
          }}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            placeholderTextColor={meta}
            style={[
              {
                flex: 1,
                fontSize: 14,
                color: ink,
                paddingVertical: 0,
              },
              style,
            ]}
            {...rest}
          />
          {rightSlot}
        </View>
        {error ? (
          <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
            {error}
          </Text>
        ) : helper ? (
          <Text style={{ fontSize: 12, color: meta, marginTop: 6 }}>{helper}</Text>
        ) : null}
      </View>
    );
  },
);
AuthField.displayName = 'AuthField';
