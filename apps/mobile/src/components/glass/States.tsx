// Loading / Empty / Error fallback views. Use across screens.

import { ReactNode } from 'react';
import { ActivityIndicator, View, Text, useColorScheme } from 'react-native';
import { Button } from './Button';

interface LoadingViewProps {
  label?: string;
}

export function LoadingView({ label }: LoadingViewProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator size="large" color={scheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
      {label && (
        <Text
          style={{
            marginTop: 12,
            color: scheme === 'dark' ? '#94A3B8' : '#64748B',
            fontSize: 14,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

interface EmptyViewProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
}

export function EmptyView({ title, body, icon, action }: EmptyViewProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      {icon}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: scheme === 'dark' ? '#F8FAFC' : '#0F172A',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {body && (
        <Text
          style={{
            fontSize: 14,
            color: scheme === 'dark' ? '#94A3B8' : '#64748B',
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {body}
        </Text>
      )}
      {action && (
        <View style={{ marginTop: 8 }}>
          <Button onPress={action.onPress}>{action.label}</Button>
        </View>
      )}
    </View>
  );
}

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ title = 'Something went wrong', message, onRetry }: ErrorViewProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: scheme === 'dark' ? '#F8FAFC' : '#0F172A',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={{
            fontSize: 14,
            color: scheme === 'dark' ? '#94A3B8' : '#64748B',
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}
      {onRetry && (
        <View style={{ marginTop: 8 }}>
          <Button onPress={onRetry} variant="secondary">
            Try again
          </Button>
        </View>
      )}
    </View>
  );
}
