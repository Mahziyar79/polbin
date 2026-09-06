import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../state/CategoriesContext';
import { Transaction } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatTime, formatToman } from '../utils/format';

export function TransactionRow({ tx, highlighted }: { tx: Transaction; highlighted?: boolean }) {
  const { resolve } = useCategories();
  const category = resolve(tx.categoryId);

  return (
    <View style={[styles.row, highlighted ? styles.highlighted : null]}>
      <View style={[styles.avatar, { backgroundColor: category.color + '1F' }]}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.merchant} numberOfLines={1}>
          {tx.merchant}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category.label} · {formatRelativeDay(tx.date)} · {formatTime(tx.date)}
        </Text>
      </View>

      <Text style={[styles.amount, tx.type === 'credit' ? styles.credit : styles.debit]}>
        {tx.type === 'credit' ? '+' : '−'} {formatToman(tx.amount, false)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  highlighted: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  middle: { flex: 1, gap: 2 },
  merchant: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textFaint },
  amount: { fontSize: 14, fontWeight: '800' },
  debit: { color: colors.text },
  credit: { color: colors.success },
});
