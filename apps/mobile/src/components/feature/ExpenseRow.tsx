// ExpenseRow — MVP design, adapted to new app's Expense type (amount stored
// as decimal-string, currency string, source includes 'recurring').
//
// Visual: 40px square color tile (group-derived bg/15) + icon, title + meta
// row (group · time · wallet), trailing Amount + optional source chip.

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Camera,
  Coffee,
  Fuel,
  Mic,
  RotateCcw,
  ShoppingBag,
  Tag,
  Utensils,
} from 'lucide-react-native';
import type { Expense, Group, Wallet } from '@voxpense/shared-types';
import { useTheme } from '../../theme/ThemeProvider';
import { Amount } from '../ui/Amount';
import { Chip } from '../ui/Chip';
import { formatTime } from '../../lib/format';

function iconFor(e: Expense) {
  const m = (e.merchant ?? '').toLowerCase();
  if (m.includes('petrol') || m.includes('fuel') || m.includes('hp')) return Fuel;
  if (m.includes('lunch') || m.includes('dine') || m.includes('food')) return Utensils;
  if (m.includes('chai') || m.includes('coffee')) return Coffee;
  if (m.includes('mart') || m.includes('store') || m.includes('shop')) return ShoppingBag;
  return Tag;
}

function needsReview(e: Expense): boolean {
  const conf = e.parseMeta?.confidence;
  if (typeof conf !== 'number') return false;
  return conf < 0.7;
}

interface ExpenseRowProps {
  expense: Expense;
  group?: Group | null;
  wallet?: Wallet | null;
}

export function ExpenseRow({ expense, group, wallet }: ExpenseRowProps) {
  const { tokens } = useTheme();
  const router = useRouter();
  const review = needsReview(expense);
  const Icon = review ? AlertTriangle : iconFor(expense);
  const color = review ? tokens.warn : group?.color ?? tokens.brand;
  const amount = parseFloat(expense.amount);

  const metaParts: string[] = [];
  if (group?.name) metaParts.push(group.name);
  metaParts.push(formatTime(expense.occurredAt));
  if (wallet?.name) metaParts.push(wallet.name);
  const meta = review ? 'Needs review · low confidence' : metaParts.join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/expense/${expense.id}`)}
      android_ripple={{ color: `${tokens.ink}14` }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${color}1A`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontWeight: '500', color: tokens.ink, fontSize: 14 }}>
          {expense.merchant ?? expense.note ?? 'Expense'}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            color: review ? tokens.warn : tokens.muted,
            marginTop: 2,
          }}
        >
          {meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Amount value={amount} currency={expense.currency} size={14} />
        {expense.source === 'voice' ? (
          <Chip
            label="Voice"
            variant="good"
            icon={<Mic size={10} color={tokens.good} />}
          />
        ) : expense.source === 'photo' ? (
          <Chip
            label="Photo"
            variant="default"
            icon={<Camera size={10} color={tokens.muted} />}
          />
        ) : expense.source === 'recurring' ? (
          <Chip
            label="Recurring"
            variant="default"
            icon={<RotateCcw size={10} color={tokens.muted} />}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
