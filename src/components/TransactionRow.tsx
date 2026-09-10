import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../state/CategoriesContext';
import { Transaction } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatTime, formatToman } from '../utils/format';
import { Text } from './Text';

interface Props {
  tx: Transaction;
  highlighted?: boolean;
  /** اگر داده شود، ردیف قابل لمس می‌شود — معمولاً برای باز کردن ویرایش. */
  onPress?: (id: string) => void;
}

/** یک ردیف تراکنش — در داشبورد و تقویم از همین استفاده می‌شود. */
export function TransactionRow({ tx, highlighted, onPress }: Props) {
  const { resolve } = useCategories();
  const category = resolve(tx.categoryId, tx.type);

  const content = (
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

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={() => onPress(tx.id)} activeOpacity={0.6}>
      {content}
    </TouchableOpacity>
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
