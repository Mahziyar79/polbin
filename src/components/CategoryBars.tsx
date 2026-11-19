import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CategoryBreakdown } from '../types';
import { colors, spacing } from '../theme';
import { formatPercent, formatToman } from '../utils/format';
import { Text } from './Text';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface Props {
  data: CategoryBreakdown[];
  /** لمس هر ردیف — داشبورد با آن به فهرست تراکنش‌های همان دسته می‌رود. */
  onPress?: (categoryId: string) => void;
}

/** نمودار میله‌ای دسته‌بندی — هر ردیف یک دسته. */
export function CategoryBars({ data, onPress }: Props) {
  const max = data.reduce((m, item) => Math.max(m, item.total), 0) || 1;

  return (
    <View style={styles.list}>
      {data.map(item => (
        <TouchableOpacity
          key={item.category.id}
          style={styles.row}
          onPress={onPress ? () => onPress(item.category.id) : undefined}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={`${item.category.label}، ${formatToman(item.total)}، ${formatPercent(item.share)}`}
          activeOpacity={0.6}>
          <View style={styles.header}>
            <Text style={styles.label} numberOfLines={1}>
              {item.category.emoji}  {item.category.label}
            </Text>
            <Text style={styles.amount}>{formatToman(item.total)}</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.bar}>
              <AnimatedProgressBar
                progress={item.total / max}
                color={item.category.color}
                accessibilityLabel={`مبلغ ${item.category.label} نسبت به بیشترین دسته`}
              />
            </View>
            <Text style={styles.share}>{formatPercent(item.share)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { flex: 1 },
  label: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  share: { minWidth: 34, textAlign: 'center', fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  amount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
});
