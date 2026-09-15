import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import { balanceOf, dayKey, groupByDay } from '../services/analytics';
import { DueInstallment, expand } from '../services/installments';
import { useInstallments } from '../state/InstallmentsContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { Transaction } from '../types';
import { formatToman, toFaDigits } from '../utils/format';
import { Text } from '../components/Text';
import {
  JALALI_MONTHS,
  JALALI_WEEK_HEADERS,
  jalaliMonthLength,
  jalaliWeekdayIndex,
  toGregorian,
  toJalali,
} from '../utils/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

interface DayCell {
  jd: number;
  date: Date;
  key: string;
}

function sumOf(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

export function CalendarScreen({ navigation }: Props) {
  const { transactions, lastAddedId } = useTransactions();
  const { installments } = useInstallments();

  const today = useMemo(() => new Date(), []);
  const todayJalali = useMemo(() => toJalali(today), [today]);

  const [visibleMonth, setVisibleMonth] = useState({
    jy: todayJalali.jy,
    jm: todayJalali.jm,
  });
  const [selected, setSelected] = useState<Date>(today);

  const byDay = useMemo(() => groupByDay(transactions), [transactions]);

  /**
   * سررسید قسط‌ها به تفکیک روز. همه‌ی برنامه‌ها یک‌جا باز می‌شوند — حداکثر
   * ۱۲۰ قسط در هر برنامه، پس برای چند وام هم ناچیز است.
   */
  const dueByDay = useMemo(() => {
    const map = new Map<string, DueInstallment[]>();
    for (const plan of installments) {
      for (const item of expand(plan, today)) {
        const key = dayKey(item.dueDate);
        const list = map.get(key);
        if (list) list.push(item);
        else map.set(key, [item]);
      }
    }
    return map;
  }, [installments, today]);

  /** روزهای ماه به‌علاوه‌ی خانه‌های خالی ابتدای هفته. */
  const { cells, leadingBlanks } = useMemo(() => {
    const length = jalaliMonthLength(visibleMonth.jy, visibleMonth.jm);
    const firstDay = toGregorian(visibleMonth.jy, visibleMonth.jm, 1);

    const days: DayCell[] = [];
    for (let jd = 1; jd <= length; jd++) {
      const date = toGregorian(visibleMonth.jy, visibleMonth.jm, jd);
      days.push({ jd, date, key: dayKey(date) });
    }

    return { cells: days, leadingBlanks: jalaliWeekdayIndex(firstDay) };
  }, [visibleMonth]);

  const selectedKey = dayKey(selected);
  const selectedJalali = toJalali(selected);
  const selectedTransactions = byDay.get(selectedKey) ?? [];
  const selectedDue = dueByDay.get(selectedKey) ?? [];

  const expenses = selectedTransactions.filter(tx => tx.type === 'debit');
  const incomes = selectedTransactions.filter(tx => tx.type === 'credit');
  /** خالص تغییرات آن روز: مثبت یعنی بیشتر گرفته‌ای تا داده‌ای. */
  const net = balanceOf(selectedTransactions);

  function shiftMonth(step: number) {
    setVisibleMonth(current => {
      const next = current.jm + step;
      if (next < 1) return { jy: current.jy - 1, jm: 12 };
      if (next > 12) return { jy: current.jy + 1, jm: 1 };
      return { jy: current.jy, jm: next };
    });
  }

  function renderGroup(title: string, list: Transaction[], accent: string) {
    if (list.length === 0) return null;

    return (
      <View style={styles.group}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={[styles.groupTotal, { color: accent }]}>{formatToman(sumOf(list))}</Text>
        </View>
        <Card>
          {list.map((tx, index) => (
            <View key={tx.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <TransactionRow
                tx={tx}
                highlighted={tx.id === lastAddedId}
                onPress={id => navigation.navigate('EditTransaction', { id })}
              />
            </View>
          ))}
        </Card>
      </View>
    );
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content}>
        <FormScreenHeader
          onBack={() => navigation.goBack()}
          title="تقویم خرج"
          subtitle="خرج و درآمد هر روز، و روزهایی که قسط داری."
        />

        <Card style={styles.calendarCard}>
          <View style={styles.monthBar}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.arrow}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {JALALI_MONTHS[visibleMonth.jm - 1]} {toFaDigits(visibleMonth.jy)}
            </Text>

            <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {JALALI_WEEK_HEADERS.map(header => (
              <View key={header} style={styles.cell}>
                <Text style={styles.weekHeader}>{header}</Text>
              </View>
            ))}

            {Array.from({ length: leadingBlanks }).map((_, index) => (
              <View key={`blank_${index}`} style={styles.cell} />
            ))}

            {cells.map(cell => {
              const dayTransactions = byDay.get(cell.key);
              const hasExpense = dayTransactions?.some(tx => tx.type === 'debit') ?? false;
              const hasIncome = dayTransactions?.some(tx => tx.type === 'credit') ?? false;
              const dueToday = dueByDay.get(cell.key);
              const hasUnpaidDue = dueToday?.some(item => !item.paid) ?? false;
              const hasPaidDue = Boolean(dueToday) && !hasUnpaidDue;
              const isSelected = cell.key === selectedKey;
              const isToday = cell.key === dayKey(today);

              return (
                <TouchableOpacity
                  key={cell.key}
                  style={styles.cell}
                  onPress={() => setSelected(cell.date)}>
                  <View
                    style={[
                      styles.dayBubble,
                      isToday ? styles.dayToday : null,
                      isSelected ? styles.daySelected : null,
                    ]}>
                    <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : null]}>
                      {toFaDigits(cell.jd)}
                    </Text>
                  </View>

                  {/* ارتفاع ثابت است تا خانه‌ها با آمدن و رفتن نقطه‌ها بالا و پایین نپرند */}
                  <View style={styles.dotRow}>
                    {hasExpense ? <View style={[styles.dot, styles.dotExpense]} /> : null}
                    {hasIncome ? <View style={[styles.dot, styles.dotIncome]} /> : null}
                    {hasUnpaidDue ? <View style={[styles.dot, styles.dotDue]} /> : null}
                    {hasPaidDue ? <View style={[styles.dot, styles.dotDuePaid]} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotExpense]} />
              <Text style={styles.legendText}>هزینه</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotIncome]} />
              <Text style={styles.legendText}>درآمد</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotDue]} />
              <Text style={styles.legendText}>سررسید قسط</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedDate}>
              {toFaDigits(selectedJalali.jd)} {JALALI_MONTHS[selectedJalali.jm - 1]}{' '}
              {toFaDigits(selectedJalali.jy)}
            </Text>
            {selectedTransactions.length > 0 ? (
              <Text
                style={[
                  styles.netValue,
                  net >= 0 ? styles.netPositive : styles.netNegative,
                ]}>
                {net >= 0 ? '+ ' : '− '}
                {formatToman(Math.abs(net))}
              </Text>
            ) : null}
          </View>

          {selectedDue.length > 0 ? (
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>قسط‌های این روز</Text>
                <Text style={[styles.groupTotal, { color: colors.primaryDark }]}>
                  {formatToman(selectedDue.reduce((sum, item) => sum + item.plan.amount, 0))}
                </Text>
              </View>
              <Card>
                {selectedDue.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.plan.id}-${item.number}`}
                    onPress={() => navigation.navigate('Installments')}
                    style={[styles.dueRow, index > 0 ? styles.dueRowStacked : null]}>
                    <View style={styles.dueText}>
                      <Text style={styles.dueTitle} numberOfLines={1}>
                        {item.plan.title}
                      </Text>
                      <Text style={styles.dueMeta}>
                        {`قسط ${toFaDigits(item.number)} از ${toFaDigits(item.plan.count)}`}
                      </Text>
                    </View>
                    <View style={styles.dueTrailing}>
                      <Text style={styles.dueAmount}>{formatToman(item.plan.amount, false)}</Text>
                      <Text style={[styles.dueStatus, item.paid ? styles.duePaid : styles.dueUnpaid]}>
                        {item.paid ? 'پرداخت شده' : 'پرداخت نشده'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ) : null}

          {selectedTransactions.length > 0 ? (
            <>
              {renderGroup('درآمد', incomes, colors.success)}
              {renderGroup('هزینه', expenses, colors.expense)}
            </>
          ) : selectedDue.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>این روز تراکنشی ثبت نشده است.</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  calendarCard: { gap: spacing.md },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  arrowText: { fontSize: 20, color: colors.primary, fontWeight: '800', lineHeight: 24 },
  monthLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: spacing.xs },
  weekHeader: { fontSize: 12, color: colors.textFaint, fontWeight: '700', paddingVertical: 4 },
  dayBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayToday: { borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    height: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: radius.pill },
  dotExpense: { backgroundColor: colors.expense },
  dotIncome: { backgroundColor: colors.success },
  dotDue: { backgroundColor: colors.gold },
  dotDuePaid: { backgroundColor: colors.border },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { flexShrink: 1, fontSize: 11, color: colors.textMuted },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dueRowStacked: { borderTopWidth: 1, borderTopColor: colors.border },
  dueText: { flex: 1, gap: 2 },
  dueTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  dueMeta: { fontSize: 12, color: colors.textFaint },
  dueTrailing: { alignItems: 'flex-end', gap: 2 },
  dueAmount: { fontSize: 14, fontWeight: '800', color: colors.text },
  dueStatus: { fontSize: 11, fontWeight: '700' },
  duePaid: { color: colors.success },
  // طلایی روی سفید کنتراست ندارد؛ نقطه طلایی می‌ماند، متن نه.
  dueUnpaid: { color: colors.primaryDark },
  section: { gap: spacing.md },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedDate: { fontSize: 16, fontWeight: '800', color: colors.text },
  netValue: { fontSize: 14, fontWeight: '800' },
  netPositive: { color: colors.success },
  netNegative: { color: colors.expense },
  group: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  groupTotal: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border },
  emptyText: {
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
