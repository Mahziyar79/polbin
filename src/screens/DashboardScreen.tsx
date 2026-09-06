import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { CategoryBars } from '../components/CategoryBars';
import { InsightCard } from '../components/InsightCard';
import { ProportionBar } from '../components/ProportionBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import { buildBreakdown, buildInsights, totalSpend, withinLastDays } from '../services/analytics';
import { useAuth } from '../state/AuthContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { formatToman, toFaDigits } from '../utils/format';
import { jalaliMonthLabel } from '../utils/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const PERIODS = [
  { days: 7, label: '۷ روز' },
  { days: 30, label: '۳۰ روز' },
] as const;

export function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { transactions, loading, error, lastAddedId, reload, takeNextFakeSms } = useTransactions();
  const [periodDays, setPeriodDays] = useState<number>(30);

  const periodTransactions = useMemo(
    () => withinLastDays(transactions, periodDays),
    [transactions, periodDays],
  );
  const total = useMemo(() => totalSpend(periodTransactions), [periodTransactions]);
  const breakdown = useMemo(() => buildBreakdown(periodTransactions), [periodTransactions]);
  const insights = useMemo(() => buildInsights(transactions), [transactions]);
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [transactions],
  );

  function handleSimulateSms() {
    navigation.navigate('ConfirmTransaction', { rawSms: takeNextFakeSms() });
  }

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
            <Text style={styles.greeting}>سلام {user?.displayName ?? ''}</Text>
            <Text style={styles.monthLabel}>{toFaDigits(jalaliMonthLabel(new Date()))}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOut}>
            <Text style={styles.signOutText}>خروج</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.periodSwitch}>
            {PERIODS.map(period => {
              const active = period.days === periodDays;
              return (
                <TouchableOpacity
                  key={period.days}
                  onPress={() => setPeriodDays(period.days)}
                  style={[styles.periodChip, active ? styles.periodChipActive : null]}>
                  <Text style={[styles.periodText, active ? styles.periodTextActive : null]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.summaryLabel}>مجموع خرج</Text>
          <Text style={styles.summaryAmount}>{formatToman(total)}</Text>
          <Text style={styles.summaryMeta}>
            {toFaDigits(periodTransactions.length)} تراکنش در {toFaDigits(periodDays)} روز گذشته
          </Text>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بینش‌ها</Text>
          {insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>خرج به تفکیک دسته</Text>
          <Card>
            {breakdown.length > 0 ? (
              <CategoryBars data={breakdown} />
            ) : (
              <Text style={styles.emptyText}>در این بازه تراکنشی ثبت نشده است.</Text>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تراکنش‌های اخیر</Text>
          <Card>
            {recent.map((tx, index) => (
              <View key={tx.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <TransactionRow tx={tx} highlighted={tx.id === lastAddedId} />
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="شبیه‌سازی دریافت پیامک بانکی" onPress={handleSimulateSms} />
        <Text style={styles.footerHint}>
          در نسخه‌ی نهایی، پیامک از طریق «هم‌رسانی» اندروید مستقیم وارد اپ می‌شود.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  errorTitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 26 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '800', color: colors.text },
  monthLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  signOut: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  signOutText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
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
  proportionWrap: { marginTop: spacing.lg },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 9, height: 9, borderRadius: radius.pill },
  legendText: { fontSize: 11, color: colors.textMuted },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  emptyText: { fontSize: 13, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.lg },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  footerHint: { fontSize: 11, color: colors.textFaint, textAlign: 'center', lineHeight: 18 },
});
