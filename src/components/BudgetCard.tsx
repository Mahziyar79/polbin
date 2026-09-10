import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatToman, formatTomanShort, toFaDigits } from '../utils/format';
import { daysLeftInJalaliMonth, jalaliMonthName } from '../utils/jalali';
import { Card } from './Card';
import { Text } from './Text';

interface Props {
  /** خرج ماه جاری به تومان. */
  spent: number;
  /** سقف ماهانه؛ null یعنی هنوز گذاشته نشده. */
  monthly: number | null;
  onPress: () => void;
}

/** زیر ۸۰٪ آرام، بین ۸۰ تا ۱۰۰ هشدار، بالای سقف قرمز. */
function toneFor(ratio: number) {
  if (ratio >= 1) return { bar: colors.expense, text: colors.expense };
  if (ratio >= 0.8) return { bar: colors.gold, text: colors.text };
  return { bar: colors.primary, text: colors.text };
}

/**
 * پیشرفت خرج ماه در برابر سقف.
 *
 * عدد «روزی چقدر» مهم‌ترین بخش است: «۸۰۰ هزار تومان مانده» به‌تنهایی نمی‌گوید
 * زیاد است یا کم؛ «روزی ۶۶ هزار تومان» قابل تصمیم‌گیری است.
 */
export function BudgetCard({ spent, monthly, onPress }: Props) {
  const monthLabel = jalaliMonthName(new Date());

  if (monthly === null) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>برای {monthLabel} سقف خرج بگذار</Text>
          <Text style={styles.emptyBody}>
            وقتی سقف داشته باشی، پول‌بین می‌گوید تا آخر ماه روزی چقدر می‌توانی خرج کنی.
          </Text>
          <Text style={styles.emptyAction}>گذاشتن سقف ماهانه ←</Text>
        </Card>
      </TouchableOpacity>
    );
  }

  const ratio = spent / monthly;
  const remaining = monthly - spent;
  const daysLeft = daysLeftInJalaliMonth();
  const tone = toneFor(ratio);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>بودجه‌ی {monthLabel}</Text>
          <Text style={[styles.percent, { color: tone.text }]}>
            {toFaDigits(Math.round(ratio * 100))}٪
          </Text>
        </View>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { backgroundColor: tone.bar, width: `${Math.min(ratio, 1) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.amounts}>
          {formatToman(spent, false)} از {formatToman(monthly)}
        </Text>

        {remaining >= 0 ? (
          <Text style={styles.hint}>
            {formatTomanShort(remaining)} مانده · {toFaDigits(daysLeft)} روز تا آخر ماه، روزی{' '}
            {formatTomanShort(Math.floor(remaining / daysLeft))}
          </Text>
        ) : (
          <Text style={styles.over}>
            {formatTomanShort(Math.abs(remaining))} از سقف گذشته‌ای
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  percent: { fontSize: 14, fontWeight: '800' },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  amounts: { fontSize: 13, color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint, lineHeight: 22 },
  over: { fontSize: 12, color: colors.expense, fontWeight: '700', lineHeight: 22 },

  emptyCard: { gap: spacing.xs, borderStyle: 'dashed', borderColor: colors.primary },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  emptyAction: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});

/** جمع خرج، بدون وابستگی به بازه‌ی انتخابیِ داشبورد. */
export function spentIn(transactions: Transaction[]): number {
  return transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
}
