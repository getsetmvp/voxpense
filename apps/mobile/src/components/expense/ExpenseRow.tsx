// Single-expense row used on Home (recent preview) + Expenses list.
// Tap → onPress. Icon disc colored from category; falls back to monochrome.

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Expense, Wallet } from '@voxpense/shared-types';

import { formatCurrency } from '../../lib/format';
import { format } from 'date-fns';

type IconName = keyof typeof Ionicons.glyphMap;

interface ExpenseRowProps {
  expense: Expense;
  currency?: string;
  category?: Category | null;
  wallet?: Wallet | null;
  onPress?: () => void;
}

// Map free-form server icon strings → Ionicons. Falls back to ellipsis.
function resolveIcon(icon: string | undefined): IconName {
  if (!icon) return 'ellipse-outline';
  const k = icon.toLowerCase();
  if (k.includes('food') || k.includes('utensil') || k.includes('restaurant')) return 'restaurant';
  if (k.includes('fuel') || k.includes('petrol') || k.includes('car')) return 'car';
  if (k.includes('grocery') || k.includes('shop') || k.includes('cart')) return 'cart';
  if (k.includes('movie') || k.includes('film') || k.includes('entertain')) return 'film';
  if (k.includes('coffee') || k.includes('cafe')) return 'cafe';
  if (k.includes('home') || k.includes('house')) return 'home';
  if (k.includes('health') || k.includes('medical')) return 'medkit';
  if (k.includes('travel') || k.includes('plane')) return 'airplane';
  if (k.includes('phone') || k.includes('bill')) return 'receipt';
  if (k.includes('gift')) return 'gift';
  if (k.includes('book') || k.includes('learn')) return 'book';
  if (k.includes('clothes') || k.includes('apparel')) return 'shirt';
  return 'pricetag-outline';
}

function withAlpha(hex: string, alpha = 0.15): string {
  // Accept #rgb, #rrggbb. Returns rgba(...).
  const m = hex.startsWith('#') ? hex.slice(1) : hex;
  if (m.length === 3) {
    const r = parseInt(m[0]! + m[0]!, 16);
    const g = parseInt(m[1]! + m[1]!, 16);
    const b = parseInt(m[2]! + m[2]!, 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (m.length === 6) {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function ExpenseRow({
  expense,
  currency = 'INR',
  category,
  wallet,
  onPress,
}: ExpenseRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';

  const catColor = category?.color ?? (isDark ? '#60A5FA' : '#3B82F6');
  const icon = resolveIcon(category?.icon);

  const title = expense.merchant?.trim() || expense.note?.trim() || 'Expense';
  const timeLabel = (() => {
    try {
      return format(new Date(expense.occurredAt), 'h:mm a');
    } catch {
      return '';
    }
  })();
  const walletLabel = wallet?.name ?? null;
  const catLabel = category?.name ?? null;

  const subParts = [catLabel, timeLabel, walletLabel].filter(Boolean) as string[];
  const subtitle = subParts.join(' · ');

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)' }}
      style={({ pressed }) => [
        rowStyles.row,
        {
          backgroundColor: isDark
            ? pressed
              ? 'rgba(31,41,55,0.85)'
              : 'rgba(31,41,55,0.55)'
            : pressed
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(255,255,255,0.62)',
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: withAlpha(catColor, 0.16),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={catColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: ink, fontSize: 14, fontWeight: '600' }}>
          {title}
        </Text>
        {subtitle.length > 0 && (
          <Text numberOfLines={1} style={{ color: meta, fontSize: 11, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text
        style={{
          color: ink,
          fontSize: 14,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatCurrency(expense.amount, expense.currency || currency)}
      </Text>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 12,
  },
});
