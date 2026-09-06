import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CategoryBreakdown } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatPercent, formatToman } from '../utils/format';

/** نمودار میله‌ای دسته‌بندی — هر ردیف یک دسته. */
export function CategoryBars({ data }: { data: CategoryBreakdown[] }) {
  const max = data.reduce((m, item) => Math.max(m, item.total), 0) || 1;

  return (
    <View style={styles.list}>
      {data.map(item => (
        <View key={item.category.id} style={styles.row}>
          <View style={styles.header}>
            <Text style={styles.label} numberOfLines={1}>
              {item.category.emoji}  {item.category.label}
            </Text>
            <Text style={styles.share}>{formatPercent(item.share)}</Text>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max((item.total / max) * 100, 3)}%`, backgroundColor: item.category.color },
              ]}
            />
          </View>

          <Text style={styles.amount}>{formatToman(item.total)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  row: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  share: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  amount: { fontSize: 12, color: colors.textFaint },
});
