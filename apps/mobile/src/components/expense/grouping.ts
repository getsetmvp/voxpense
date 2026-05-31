// Day-bucket grouping for expense lists. Pure, testable.
// Produces flat row list for FlatList (header rows + expense rows) so we can
// scroll smoothly without nested SectionList overhead.

import { format, isToday, isYesterday, isSameYear } from 'date-fns';
import type { Expense } from '@voxpense/shared-types';

import { toNumber } from '../../lib/insights';

export interface DayGroup {
  dayKey: string; // YYYY-MM-DD
  label: string; // "Today" / "Yesterday" / "Mon 27 May"
  date: Date;
  total: number;
  items: Expense[];
}

export type ListRow =
  | { kind: 'header'; group: DayGroup }
  | { kind: 'item'; expense: Expense };

/** Local-day key from an ISO timestamp. */
function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function labelForDate(d: Date, now = new Date()): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isSameYear(d, now)) return format(d, 'EEE d MMM');
  return format(d, 'd MMM yyyy');
}

export function groupByDay(expenses: Expense[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const exp of expenses) {
    const key = localDayKey(exp.occurredAt);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(exp);
      existing.total += toNumber(exp.amount);
    } else {
      const date = new Date(exp.occurredAt);
      map.set(key, {
        dayKey: key,
        label: labelForDate(date),
        date,
        total: toNumber(exp.amount),
        items: [exp],
      });
    }
  }
  // Sort descending by day, then sort items descending by occurredAt.
  return Array.from(map.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((g) => ({
      ...g,
      items: g.items
        .slice()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        ),
    }));
}

/** Flatten DayGroup[] into ListRow[] for FlatList. */
export function toListRows(groups: DayGroup[]): ListRow[] {
  const rows: ListRow[] = [];
  for (const g of groups) {
    rows.push({ kind: 'header', group: g });
    for (const exp of g.items) rows.push({ kind: 'item', expense: exp });
  }
  return rows;
}
