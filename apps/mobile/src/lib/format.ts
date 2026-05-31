// Currency + date formatters. Always pass user.baseCurrency for currency calls.

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function formatCurrency(amount: string | number, currency = 'INR'): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatCompact(amount: string | number, currency = 'INR'): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return '—';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  const abs = Math.abs(n);
  if (abs >= 10_000_000) return `${sym}${(n / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${sym}${(n / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}k`;
  return `${sym}${n.toFixed(0)}`;
}

export function formatDate(iso: string, pattern = 'd MMM yyyy'): string {
  try {
    return format(new Date(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'd MMM, h:mm a');
}

export function formatTimeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}
