// FormBanner — inline error / info banner above a form. Used to surface
// API errors at the top of an auth card.

import { Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Tone = 'error' | 'info' | 'success';

interface FormBannerProps {
  message: string;
  tone?: Tone;
}

const tones: Record<Tone, { bgLight: string; bgDark: string; fg: string; icon: 'alert-triangle' | 'info' | 'check-circle' }> = {
  error: { bgLight: 'rgba(239,68,68,0.10)', bgDark: 'rgba(248,113,113,0.14)', fg: '#EF4444', icon: 'alert-triangle' },
  info: { bgLight: 'rgba(6,182,212,0.10)', bgDark: 'rgba(34,211,238,0.14)', fg: '#06B6D4', icon: 'info' },
  success: { bgLight: 'rgba(16,185,129,0.10)', bgDark: 'rgba(52,211,153,0.14)', fg: '#10B981', icon: 'check-circle' },
};

export function FormBanner({ message, tone = 'error' }: FormBannerProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = tones[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: scheme === 'dark' ? t.bgDark : t.bgLight,
      }}
    >
      <Feather name={t.icon} size={16} color={t.fg} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: t.fg, fontWeight: '500' }}>
        {message}
      </Text>
    </View>
  );
}
