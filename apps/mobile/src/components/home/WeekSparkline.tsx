// WeekSparkline — week-spend trend line + filled gradient area.
// Uses react-native-svg (already a dep of expo). Falls back to a thin static
// preview line when no data. Renders the Mon..Sun axis labels below.

import { Text, View, useColorScheme } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Circle,
} from 'react-native-svg';

interface WeekSparklineProps {
  /** Seven daily totals (Mon → Sun). Pad with 0s as needed. */
  values: number[];
  /** Label row beneath the chart. Default Mon..Sun. */
  axisLabels?: string[];
  width?: number;
  height?: number;
}

const DEFAULT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekSparkline({
  values,
  axisLabels = DEFAULT_LABELS,
  width = 280,
  height = 60,
}: WeekSparklineProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const brand = isDark ? '#60A5FA' : '#3B82F6';
  const meta = isDark ? '#94A3B8' : '#94A3B8';

  const safe = values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const stepX = width / Math.max(1, safe.length - 1);

  // Map each value to (x, y). Reserve top 6px of padding so the dot doesn't clip.
  const points = safe.map((v, i) => {
    const x = i * stepX;
    const y = height - 6 - (v / max) * (height - 14);
    return { x, y };
  });

  // Build straight-line path (mockup is jagged, not smoothed).
  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const lastPoint = points[points.length - 1] ?? { x: width, y: height / 2 };

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={brand} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={brand} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#sparkFill)" />
        <Path
          d={linePath}
          stroke={brand}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={brand} />
      </Svg>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        {axisLabels.map((l) => (
          <Text
            key={l}
            style={{ fontSize: 10, fontWeight: '500', color: meta }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}
