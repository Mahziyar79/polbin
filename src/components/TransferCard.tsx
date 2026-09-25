import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Transaction, TransactionType } from '../types';
import { formatRelativeDay, formatTime, formatToman, toFaDigits } from '../utils/format';
import { Card } from './Card';
import { Text } from './Text';

interface Props {
  /** سرِ دیگرِ انتقال که قبلاً ثبت شده. */
  counterpart: Transaction;
  /** نوع تراکنشی که الان در حال تایید است. */
  type: TransactionType;
  /** کاربر تصمیمش را گرفته؟ null یعنی هنوز نه. */
  decision: boolean | null;
  onDecide: (isTransfer: boolean) => void;
}

/** «کارت ۱۲۳۴ بانک ملت»، «حساب ۵۸۴۰ بلوبانک»، یا «بانک ملت». */
function accountPhrase(tx: Transaction): string {
  const bank = tx.bank ?? 'حساب دیگر';
  if (tx.cardLast4) return `کارت ${toFaDigits(tx.cardLast4)} ${bank}`;
  if (tx.accountLast4) return `حساب ${toFaDigits(tx.accountLast4)} ${bank}`;
  return bank;
}

/**
 * پیشنهاد «این انتقال بین کارت‌های خودت است؟» بالای فرم تایید.
 *
 * پیشنهاد است نه حکم: جفت شدن مبلغ و زمان قوی است ولی قطعی نیست — پولی که به
 * دوستی دادی و همان لحظه کسی همان مبلغ را برایت ریخت هم همین شکل را دارد.
 * بعد از تصمیم، کارت به یک خط کوچک تبدیل می‌شود تا فرم زیرش خلوت بماند.
 */
export function TransferCard({ counterpart, type, decision, onDecide }: Props) {
  const incoming = type === 'credit';

  if (decision !== null) {
    return (
      <View style={styles.decided}>
        <Text style={styles.decidedText}>
          {decision
            ? 'به‌عنوان انتقال بین حساب‌های خودت ثبت می‌شود و در خرج و درآمد حساب نمی‌آید.'
            : `به‌عنوان ${incoming ? 'درآمد' : 'خرج'} عادی ثبت می‌شود.`}
        </Text>
        <TouchableOpacity onPress={() => onDecide(!decision)} accessibilityRole="button">
          <Text style={styles.change}>تغییر</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>انتقال بین کارت‌های خودت است؟</Text>
      <Text style={styles.body}>
        {`${formatToman(counterpart.amount)} ${incoming ? 'از' : 'به'} ${accountPhrase(counterpart)} ${formatRelativeDay(counterpart.date)} ${formatTime(counterpart.date)} ${incoming ? 'برداشت' : 'واریز'} شده — با همین مبلغ. اگر جابه‌جایی بین حساب‌های خودت است، نباید خرج یا درآمد شمرده شود.`}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onDecide(true)} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>بله، انتقال خودم است</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDecide(false)} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>{incoming ? 'نه، درآمد است' : 'نه، خرج است'}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, backgroundColor: colors.primarySoft, borderColor: colors.primary },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  primary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  primaryText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  secondary: { paddingVertical: spacing.sm },
  secondaryText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },

  decided: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  decidedText: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 20 },
  change: { fontSize: 12, fontWeight: '800', color: colors.primary },
});
