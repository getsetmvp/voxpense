// AuthSegmented — Sign in / Sign up segmented toggle from mockup 02/03.
// Active segment: white card on light, surf-d0 on dark, with subtle shadow.

import { Pressable, Text, View, useColorScheme } from 'react-native';

interface AuthSegmentedProps {
  active: 'signin' | 'signup';
  onChange: (next: 'signin' | 'signup') => void;
}

export function AuthSegmented({ active, onChange }: AuthSegmentedProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const trackBg = isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,1)';
  const activeBg = isDark ? '#111827' : '#FFFFFF';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: trackBg,
        borderRadius: 14,
        padding: 4,
      }}
    >
      {(['signin', 'signup'] as const).map((key) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(key)}
            style={({ pressed }) => ({
              flex: 1,
              height: 40,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? activeBg : 'transparent',
              shadowColor: isActive ? '#000' : 'transparent',
              shadowOpacity: isActive ? 0.06 : 0,
              shadowRadius: isActive ? 6 : 0,
              shadowOffset: { width: 0, height: 2 },
              elevation: isActive ? 2 : 0,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isActive ? ink : meta,
              }}
            >
              {key === 'signin' ? 'Sign in' : 'Sign up'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
