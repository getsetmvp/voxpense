// Empty state for expense list — supports two variants:
// - filtered: "No expenses match" + clear-filters CTA
// - all: "Nothing yet" + add-expense CTA
//
// Wrapper provides explicit minHeight so the contained <EmptyView>'s
// `flex: 1` resolves to a real value when rendered inside a ScrollView
// (otherwise the icon + title + CTA collapse to 0px and look invisible).

import { View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyView } from '../glass';

interface EmptyExpensesProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  onAdd?: () => void;
}

export function EmptyExpenses({ hasFilters, onClearFilters, onAdd }: EmptyExpensesProps) {
  const scheme = useColorScheme() ?? 'light';
  const tint = scheme === 'dark' ? '#60A5FA' : '#3B82F6';
  if (hasFilters) {
    return (
      <View style={{ flex: 1, minHeight: 360, paddingTop: 24 }}>
        <EmptyView
          title="No expenses match"
          body="Try widening your filters or clearing them to see everything."
          icon={<Ionicons name="filter-circle-outline" size={56} color={tint} />}
          action={
            onClearFilters
              ? { label: 'Clear filters', onPress: onClearFilters }
              : undefined
          }
        />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, minHeight: 360, paddingTop: 24 }}>
      <EmptyView
        title="Nothing yet"
        body="Tap the mic or + to log your first expense."
        icon={<Ionicons name="wallet-outline" size={56} color={tint} />}
        action={onAdd ? { label: 'Add expense', onPress: onAdd } : undefined}
      />
    </View>
  );
}
