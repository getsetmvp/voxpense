// Bar chart for daily spend over a window. Pure RN Views + math — no SVG.
// Each bar is a vertically-stretched View; max value scales to chartHeight.

import { View, Text, useColorScheme } from 'react-native';

interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: Bar[];
  height?: number;
  showLabels?: boolean;
  barColor?: string;
  highlightColor?: string;
}

export function BarChart({
  data,
  height = 96,
  showLabels = true,
  barColor,
  highlightColor,
}: BarChartProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const fallbackBar = isDark ? '#1F2937' : '#E2E8F0';
  const fallbackHi = isDark ? '#60A5FA' : '#3B82F6';
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height,
          gap: 4,
        }}
      >
        {data.map((bar, i) => {
          const h = (bar.value / max) * height;
          const minH = bar.value > 0 ? 3 : 1;
          const isHi = bar.highlight ?? false;
          return (
            <View
              key={i}
              style={{ flex: 1, height, justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  height: Math.max(minH, h),
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: isHi
                    ? (highlightColor ?? fallbackHi)
                    : (barColor ?? fallbackBar),
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels && (
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
          {data.map((bar, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#64748B' : '#94A3B8',
                  fontWeight: '500',
                }}
                numberOfLines={1}
              >
                {bar.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
