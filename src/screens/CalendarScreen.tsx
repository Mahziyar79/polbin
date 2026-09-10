import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import { dayKey, groupByDay } from '../services/analytics';
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

  const today = useMemo(() => new Date(), []);
  const todayJalali = useMemo(() => toJalali(today), [today]);

  const [visibleMonth, setVisibleMonth] = useState({
    jy: todayJalali.jy,
    jm: todayJalali.jm,
  });
  const [selected, setSelected] = useState<Date>(today);

  const byDay = useMemo(() => groupByDay(transactions), [transactions]);

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

  const expenses = selectedTransactions.filter(tx => tx.type === 'debit');
  const incomes = selectedTransactions.filter(tx => tx.type === 'credit');
  /** خالص تغییرات آن روز: مثبت یعنی بیشتر گرفته‌ای تا داده‌ای. */
  const net = sumOf(incomes) - sumOf(expenses);

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
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>تقویم خرج</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Text style={styles.closeText}>بستن</Text>
          </TouchableOpacity>
        </View>

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
                  </View>
                </TouchableOpacity>
              );
            })}
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

          {selectedTransactions.length > 0 ? (
            <>
              {renderGroup('درآمد', incomes, colors.success)}
              {renderGroup('هزینه', expenses, colors.expense)}
            </>
          ) : (
            <Card>
              <Text style={styles.emptyText}>این روز تراکنشی ثبت نشده است.</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  closeText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
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
