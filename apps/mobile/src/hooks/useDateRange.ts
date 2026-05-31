// Date-range preset helpers for expense filters + home week-summary.
// Returns ISO strings (server contract uses ISO datetimes).

import {
  addDays,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '../lib/insights';

export type DateRangePreset =
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'last30'
  | 'lastMonth'
  | 'all';

export const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'thisWeek', label: 'This week' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'all', label: 'All time' },
];

export interface DateRange {
  from?: string; // ISO
  to?: string; // ISO
  label: string;
}

export function rangeForPreset(preset: DateRangePreset, now = new Date()): DateRange {
  const startToday = startOfDay(now);
  const endNow = new Date(now);
  switch (preset) {
    case 'today':
      return { from: startToday.toISOString(), to: endNow.toISOString(), label: 'Today' };
    case 'thisWeek':
      return {
        from: startOfWeek(now).toISOString(),
        to: endNow.toISOString(),
        label: 'This week',
      };
    case 'thisMonth':
      return {
        from: startOfMonth(now).toISOString(),
        to: endNow.toISOString(),
        label: 'This month',
      };
    case 'last30':
      return {
        from: startOfDay(addDays(now, -30)).toISOString(),
        to: endNow.toISOString(),
        label: 'Last 30 days',
      };
    case 'lastMonth': {
      const firstThisMonth = startOfMonth(now);
      const firstLastMonth = new Date(
        firstThisMonth.getFullYear(),
        firstThisMonth.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );
      return {
        from: firstLastMonth.toISOString(),
        to: firstThisMonth.toISOString(),
        label: 'Last month',
      };
    }
    case 'all':
    default:
      return { from: undefined, to: undefined, label: 'All time' };
  }
}
