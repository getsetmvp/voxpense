// Donut chart for category breakdown. Uses react-native-svg.
// Renders proportional arcs in a single ring with center hole.

import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Slice {
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Slice[];
  size?: number;
  stroke?: number;
  trackColor?: string;
}

export function DonutChart({
  data,
  size = 96,
  stroke = 14,
  trackColor = '#E2E8F0',
}: DonutChartProps) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((acc, s) => acc + Math.max(0, s.value), 0);

  let offset = 0;
  const arcs = data.map((slice, i) => {
    const share = total > 0 ? Math.max(0, slice.value) / total : 0;
    const dash = circumference * share;
    const node = (
      <Circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={slice.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    );
    offset += dash;
    return node;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {total > 0 ? arcs : null}
      </Svg>
    </View>
  );
}
