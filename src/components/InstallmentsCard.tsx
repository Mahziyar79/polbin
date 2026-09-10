import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { DueInstallment, dueInJalaliMonth, unpaidThisMonth } from '../services/installments';
import { colors, spacing } from '../theme';
import { Installment } from '../types';
import { formatToman, toFaDigits } from '../utils/format';
import { jalaliMonthName } from '../utils/jalali';
import { Card } from './Card';
import { Text } from './Text';

interface Props {
  installments: Installment[];
  onPress: () => void;
}

/**
 * جمله‌ی وضعیت نزدیک‌ترین قسط.
 *
 * همه‌ی حالت‌ها عمداً با یک واژه‌ی فارسی شروع می‌شوند. اگر جمله با گیومه و بعد
 * عنوانِ لاتین («Vam») شروع شود، اولین نویسه‌ی جهت‌دارِ خط لاتین می‌شود و اندروید
 * کل سطر را چپ‌به‌راست می‌چیند: «روز عقب افتاده ۱۴ «Vam»».
 */
function dueSentence(item: DueInstallment): string {
  const title = `«${item.plan.title}»`;

  if (item.daysLeft < 0) {
    return `سررسید ${title} ${toFaDigits(-item.daysLeft)} روز عقب افتاده`;
  }
  if (item.daysLeft === 0) return `سررسید ${title} امروز است`;
  if (item.daysLeft === 1) return `سررسید ${title} فرداست`;
  return `سررسید ${title} تا ${toFaDigits(item.daysLeft)} روز دیگر است`;
}

/**
 * قسط‌های همین ماه، روی داشبورد.
 *
 * عمداً فقط ماه جاری را می‌شمارد نه کل بدهی: کاربر برای تصمیم این ماه نگاه
 * می‌کند، و عدد بزرگِ «۱۲۰ میلیون باقی‌مانده» فقط می‌ترساند بی‌آنکه کاری از
 * دستش بربیاید.
 */
export function InstallmentsCard({ installments, onPress }: Props) {
  if (installments.length === 0) return <InstallmentsEmptyCard onPress={onPress} />;

  const monthLabel = jalaliMonthName(new Date());
  const due = dueInJalaliMonth(installments);
  const unpaid = due.filter(item => !item.paid);
  const amount = unpaidThisMonth(installments);

  // اولین پرداخت‌نشده‌ی ماه؛ اگر ماه تسویه شده، چیزی برای هشدار دادن نیست.
  const soonest = unpaid[0] ?? null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {`قسط‌های ${monthLabel}`}
          </Text>
          <Text style={styles.count}>{`${toFaDigits(due.length)} قسط`}</Text>
        </View>

        {unpaid.length > 0 ? (
          <>
            <Text style={styles.amount}>{formatToman(amount)}</Text>
            <Text style={styles.meta}>
              {`${toFaDigits(unpaid.length)} قسط پرداخت‌نشده در این ماه`}
            </Text>
            {soonest ? (
              <Text style={[styles.due, soonest.daysLeft <= 0 ? styles.dueLate : null]}>
                {dueSentence(soonest)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.settled}>
            {due.length > 0
              ? 'قسط‌های این ماه را پرداخت کرده‌ای 🎉'
              : 'این ماه قسطی سررسید ندارد.'}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function InstallmentsEmptyCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>قسط‌هایت را وارد کن</Text>
        <Text style={styles.emptyBody}>
          وقتی وام و قسط‌هایت را ثبت کنی، پول‌بین می‌گوید هر ماه چقدر از پولت از قبل
          تعهد شده و چه روزی باید پرداخت کنی.
        </Text>
        <Text style={styles.emptyAction}>افزودن قسط ←</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // مثل BudgetCard، `borderStyle` صریح است تا اگر روی کارت خالی تطبیق شد ریست شود.
  card: { gap: spacing.xs, borderStyle: 'solid' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  count: { fontSize: 12, color: colors.textFaint },
  amount: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  due: { fontSize: 12, color: colors.textFaint, lineHeight: 22 },
  dueLate: { color: colors.expense, fontWeight: '700' },
  settled: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },

  emptyCard: { gap: spacing.xs, borderStyle: 'dashed', borderColor: colors.primary },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  emptyAction: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
