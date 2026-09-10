import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { CategoryBars } from '../components/CategoryBars';
import { Fab } from '../components/Fab';
import { ProportionBar } from '../components/ProportionBar';
import { AppMenu } from '../components/AppMenu';
import { BudgetCard } from '../components/BudgetCard';
import { InstallmentsCard } from '../components/InstallmentsCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { SmsAutoCard } from '../components/SmsAutoCard';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import {
  balanceOf,
  buildBreakdown,
  totalIncome,
  totalSpend,
  withinJalaliMonth,
  withinLastDays,
} from '../services/analytics';
import { useBudget } from '../state/BudgetContext';
import { useInstallments } from '../state/InstallmentsContext';
import { useProfile } from '../state/ProfileContext';
import { useCategories } from '../state/CategoriesContext';
import { useTransactions } from '../state/TransactionsContext';
import { unpaidThisMonth } from '../services/installments';
import { colors, radius, spacing } from '../theme';
import { Transaction, TransactionType } from '../types';
import { formatToman, toFaDigits } from '../utils/format';
import { jalaliLongDate } from '../utils/jalali';
import { Text } from '../components/Text';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

/**
 * «۳۰ روز گذشته» جای خود را به ماه شمسی داد.
 *
 * پنجره‌ی غلتان با هیچ چیزی در ذهن کاربر جور درنمی‌آید: کسی نمی‌پرسد «۳۰ روز
 * اخیر چقدر خرج کردم»، می‌پرسد «شهریور چقدر خرج کردم». بودجه هم ماهانه است،
 * پس هر دو روی یک تقویم می‌نشینند.
 */
const PERIODS = [
  { id: 'today', label: 'امروز', summary: 'امروز' },
  { id: 'week', label: '۷ روز', summary: 'در ۷ روز گذشته' },
  { id: 'month', label: 'این ماه', summary: 'در این ماه' },
  { id: 'lastMonth', label: 'ماه قبل', summary: 'در ماه قبل' },
] as const;

type PeriodId = (typeof PERIODS)[number]['id'];

function transactionsInPeriod(transactions: Transaction[], period: PeriodId): Transaction[] {
  switch (period) {
    case 'today':
      return withinLastDays(transactions, 1);
    case 'week':
      return withinLastDays(transactions, 7);
    case 'month':
      return withinJalaliMonth(transactions, 0);
    case 'lastMonth':
      return withinJalaliMonth(transactions, 1);
  }
}

const MODES = [
  { value: 'debit', label: 'هزینه‌ها', color: colors.expense },
  { value: 'credit', label: 'درآمدها', color: colors.success },
] as const;

export function DashboardScreen({ navigation }: Props) {
  const { profile } = useProfile();
  const { transactions, loading, error, lastAddedId, reload } = useTransactions();
  const { categories } = useCategories();
  const [mode, setMode] = useState<TransactionType>('debit');
  const [periodId, setPeriodId] = useState<PeriodId>(PERIODS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const { monthly, } = useBudget();
  const { installments } = useInstallments();
  const isExpense = mode === 'debit';
  const activePeriod = PERIODS.find(item => item.id === periodId) ?? PERIODS[0];

  const periodTransactions = useMemo(
    () => transactionsInPeriod(transactions, periodId),
    [transactions, periodId],
  );

  // بودجه همیشه ماه جاری را می‌سنجد، مستقل از بازه‌ای که کاربر انتخاب کرده.
  const spentThisMonth = useMemo(
    () => totalSpend(withinJalaliMonth(transactions, 0)),
    [transactions],
  );
  // قسط‌های پرداخت‌نشده‌ی همین ماه، برای کم شدن از عدد آزادِ بودجه.
  const committed = useMemo(() => unpaidThisMonth(installments), [installments]);
  const total = useMemo(() => totalSpend(periodTransactions), [periodTransactions]);
  const income = useMemo(() => totalIncome(periodTransactions), [periodTransactions]);
  const balance = useMemo(() => balanceOf(periodTransactions), [periodTransactions]);
  const breakdown = useMemo(
    () => buildBreakdown(periodTransactions, categories, mode),
    [periodTransactions, categories, mode],
  );
  const recent = useMemo(
    () =>
      transactions
        .filter(tx => tx.type === mode)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [transactions, mode],
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBox}>
          <Text style={styles.errorTitle}>{error}</Text>
          <AppButton title="تلاش دوباره" onPress={reload} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>
              {profile.displayName ? `سلام ${profile.displayName} 👋` : 'سلام 👋'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.monthLabel}>
                {toFaDigits(jalaliLongDate(new Date()))}  📅
              </Text>
            </TouchableOpacity>
          </View>
          {/* «پشتیبان» به منو منتقل شد؛ این جای خالی حالا در منو را باز می‌کند. */}
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.topAction}
            accessibilityLabel="منو">
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        <SmsAutoCard />

        <View style={styles.modeTabs}>
          {MODES.map(option => {
            const active = option.value === mode;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setMode(option.value)}
                style={[styles.modeTab, active ? styles.modeTabActive : null]}>
                <Text style={[styles.modeText, active ? { color: option.color } : null]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.periodSwitch}>
            {PERIODS.map(period => {
              const active = period.id === periodId;
              return (
                <TouchableOpacity
                  key={period.id}
                  onPress={() => setPeriodId(period.id)}
                  style={[styles.periodChip, active ? styles.periodChipActive : null]}>
                  <Text style={[styles.periodText, active ? styles.periodTextActive : null]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.summaryLabel}>{isExpense ? 'مجموع خرج' : 'مجموع درآمد'}</Text>
          <Text style={[styles.summaryAmount, isExpense ? styles.summaryExpense : styles.summaryIncome]}>
            {formatToman(isExpense ? total : income)}
          </Text>
          <Text style={styles.summaryMeta}>
            {toFaDigits(periodTransactions.length)} تراکنش {activePeriod.summary}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{isExpense ? 'درآمد' : 'خرج'}</Text>
              <Text style={[styles.statValue, isExpense ? styles.statIncome : styles.statExpense]}>
                {formatToman(isExpense ? income : total)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statLabel}>مانده</Text>
              <Text style={styles.statValue}>
                {balance < 0 ? '− ' : ''}
                {formatToman(Math.abs(balance))}
              </Text>
             
            </View>
          </View>

          <View style={styles.proportionWrap}>
            <ProportionBar data={breakdown} />
          </View>

          <View style={styles.legend}>
            {breakdown.slice(0, 4).map(item => (
              <View key={item.category.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.category.color }]} />
                <Text style={styles.legendText}>{item.category.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {isExpense ? (
          <>
            <BudgetCard
              spent={spentThisMonth}
              monthly={monthly}
              committed={committed}
              onPress={() => navigation.navigate('Budget')}
            />
            <InstallmentsCard
              installments={installments}
              onPress={() =>
                installments.length === 0
                  ? navigation.navigate('AddInstallment', {})
                  : navigation.navigate('Installments')
              }
            />
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isExpense ? 'هزینه‌های اخیر' : 'درآمدهای اخیر'}
          </Text>
          <Card>
            {recent.length === 0 ? (
              <Text style={styles.sectionEmpty}>
                {isExpense ? 'هنوز خرجی ثبت نشده.' : 'هنوز درآمدی ثبت نشده.'}
              </Text>
            ) : (
              recent.map((tx, index) => (
                <View key={tx.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TransactionRow
                    tx={tx}
                    highlighted={tx.id === lastAddedId}
                    onPress={id => navigation.navigate('EditTransaction', { id })}
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isExpense ? 'خرج به تفکیک دسته' : 'درآمد به تفکیک دسته'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.sectionAction}>مدیریت دسته‌بندی‌ها</Text>
            </TouchableOpacity>
          </View>
          <Card>
            {breakdown.length > 0 ? (
              <CategoryBars data={breakdown} />
            ) : (
              <Text style={styles.emptyText}>
                {isExpense
                  ? 'در این بازه خرجی ثبت نشده است.'
                  : 'در این بازه درآمدی ثبت نشده است.'}
              </Text>
            )}
          </Card>
        </View>

        <Text style={styles.hint}>
          پیامک بانکی را از پیام‌رسان با «هم‌رسانی» به پول‌بین بده تا خودکار ثبت شود.
        </Text>
      </ScrollView>

      <Fab
        actions={[
          {
            key: 'add',
            label: 'افزودن تراکنش',
            emoji: '➕',
            onPress: () => navigation.navigate('AddTransaction'),
          },
        ]}
      />

      <AppMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={route => {
          setMenuOpen(false);
          navigation.navigate(route as 'Calendar');
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 96 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  errorTitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 26 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '800', color: colors.text },
  monthLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  // اندازه‌ی ثابت، وگرنه با یک آیکون باریک، borderRadius گرد آن را بیضی می‌کرد.
  topAction: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  menuIcon: { fontSize: 18, color: colors.text },
  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#12343B',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  modeText: { fontSize: 15, fontWeight: '800', color: colors.textMuted },
  summaryIncome: { color: colors.success },
  summaryExpense: { color: colors.expense },
  summaryCard: { gap: spacing.xs },
  periodSwitch: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  periodChipActive: { backgroundColor: colors.surface },
  periodText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  periodTextActive: { color: colors.primary },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: colors.text },
  summaryMeta: { fontSize: 12, color: colors.textFaint },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, gap: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  statIncome: { color: colors.success },
  statExpense: { color: colors.expense },
  /** خط طلایی زیر «مانده» — رنگ طلا برای متن کنتراست کافی ندارد. */
  balanceAccent: {
    height: 3,
    width: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  balanceAccentNegative: { backgroundColor: colors.expense },
  proportionWrap: { marginTop: spacing.lg },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 9, height: 9, borderRadius: radius.pill },
  legendText: { fontSize: 11, color: colors.textMuted },
  section: { gap: spacing.md },
  sectionEmpty: {
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionAction: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
  emptyText: { fontSize: 13, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.lg },
  hint: { fontSize: 11, color: colors.textFaint, textAlign: 'center', lineHeight: 18 },
});
