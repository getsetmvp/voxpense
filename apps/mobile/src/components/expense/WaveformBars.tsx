// WaveformBars — static decorative waveform used by the voice-note card.
// Renders a row of pseudo-random rounded bars; first N are "played" (brand),
// remainder are "remaining" (ink-l3). Pure SVG, no audio engine.

import { useColorScheme } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface WaveformBarsProps {
  width?: number;
  height?: number;
  /** Total bars to render. */
  bars?: number;
  /** Fraction played (0..1). Bars under this point colored brand; rest muted. */
  progress?: number;
}

// Deterministic pseudo-random heights so layout stays stable across re-renders.
function barHeight(i: number, max: number, min = 6): number {
  const seed = Math.sin(i * 13.37) * 10000;
  const frac = seed - Math.floor(seed);
  return Math.max(min, Math.round(min + frac * (max - min)));
}

export function WaveformBars({
  width = 200,
  height = 28,
  bars = 28,
  progress = 0.45,
}: WaveformBarsProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const brand = isDark ? '#60A5FA' : '#3B82F6';
  const muted = isDark ? '#475569' : '#94A3B8';

  const gap = 3;
  const barWidth = (width - gap * (bars - 1)) / bars;
  const playedCount = Math.round(progress * bars);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = barHeight(i, height - 4);
        const x = i * (barWidth + gap);
        const y = (height - h) / 2;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={Math.max(2, barWidth)}
            height={h}
            rx={1.5}
            fill={i < playedCount ? brand : muted}
          />
        );
      })}
    </Svg>
  );
}
