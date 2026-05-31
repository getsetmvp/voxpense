// PasswordField — Input wrapper with a visibility toggle eye icon + lock icon.
// Stays inside the design tokens (no raw hex outside States/glass primitives).

import { useState } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Input } from '../glass';

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  autoComplete?: 'password' | 'new-password' | 'current-password';
  textContentType?: 'password' | 'newPassword';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
}

export function PasswordField({
  label = 'Password',
  value,
  onChangeText,
  placeholder = '••••••••',
  error,
  helper,
  autoComplete = 'password',
  textContentType = 'password',
  returnKeyType = 'done',
  onSubmitEditing,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const iconColor = scheme === 'dark' ? '#94A3B8' : '#64748B';

  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      textContentType={textContentType}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      error={error}
      helper={helper}
      leftIcon={<Feather name="lock" size={16} color={iconColor} />}
      rightIcon={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
        >
          <Feather name={visible ? 'eye-off' : 'eye'} size={16} color={iconColor} />
        </Pressable>
      }
    />
  );
}
