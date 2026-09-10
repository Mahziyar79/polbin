import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { BankMark } from '../components/BankMark';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { findBank } from '../data/banks';
import { RootStackParamList } from '../navigation/types';
import {
  DueInstallment,
  DueStatus,
  expand,
  isFinished,
  nextUnpaid,
  remainingAmount,
  remainingCount,
  unpaidThisMonth,
} from '../services/installments';
import { useInstallments } from '../state/InstallmentsContext';
import { colors, radius, spacing } from '../theme';
import { Installment } from '../types';
import { formatJalaliDate, formatToman, formatTomanShort, toFaDigits } from '../utils/format';
import { jalaliMonthName } from '../utils/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Installments'>;

const STATUS_TONE: Record<DueStatus, { bg: string; fg: string }> = {
  paid: { bg: colors.successSoft, fg: colors.success },
  overdue: { bg: colors.dangerSoft, fg: colors.danger },
  today: { bg: colors.dangerSoft, fg: colors.danger },
  soon: { bg: colors.primarySoft, fg: colors.primaryDark },
  later: { bg: colors.surfaceAlt, fg: colors.textMuted },
};

/** برچسب کوتاه کنار هر قسط. */
function statusLabel(item: DueInstallment): string {
  switch (item.status) {
    case 'paid':
      return 'پرداخت شد';
    case 'overdue':
      return `${toFaDigits(-item.daysLeft)} روز تأخیر`;
    case 'today':
      return 'امروز';
    case 'soon':
      return item.daysLeft === 1 ? 'فردا' : `${toFaDigits(item.daysLeft)} روز دیگر`;
    case 'later':
      return `${toFaDigits(item.daysLeft)} روز دیگر`;
  }
}

/**
 * مدیریت قسط‌ها.
 *
 * هر «برنامه» یک وام یا خرید قسطی است و خودش تاریخ‌های سررسید را می‌سازد؛
 * کاربر لازم نیست سی‌وشش ردیف دستی وارد کند. زدن روی هر کارت جدول کاملش را
 * باز می‌کند و از همان‌جا می‌شود هر قسط را پرداخت‌شده علامت زد.
 *
 * فعلاً یادآوری خودکار ندارد — آن مرحله‌ی بعد است و کار نیتیو می‌خواهد.
 */
export function InstallmentsScreen({ navigation }: Props) {
  const { installments, togglePaid } = useInstallments();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { active, finished } = useMemo(() => {
    const sorted = [...installments].sort((a, b) => {
      const nextA = nextUnpaid(a)?.dueDate.getTime() ?? Infinity;
      const nextB = nextUnpaid(b)?.dueDate.getTime() ?? Infinity;
      return nextA - nextB;
    });

    return {
      active: sorted.filter(plan => !isFinished(plan)),
      finished: sorted.filter(isFinished),
    };
  }, [installments]);

  const monthTotal = useMemo(() => unpaidThisMonth(installments), [installments]);
  const totalRemaining = useMemo(
    () => active.reduce((sum, plan) => sum + remainingAmount(plan), 0),
    [active],
  );

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content}>
        <FormScreenHeader
          title="قسط‌ها"
          subtitle="وام‌ها و خریدهای قسطی‌ات. تاریخ سررسید هر قسط خودکار حساب می‌شود."
        />

        {installments.length > 0 ? (
          <Card style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{`پرداخت‌نشده‌ی ${jalaliMonthName(new Date())}`}</Text>
              <Text style={styles.summaryValue}>{formatToman(monthTotal)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>کل باقی‌مانده</Text>
              <Text style={styles.summaryValue}>{formatTomanShort(totalRemaining)}</Text>
            </View>
          </Card>
        ) : null}

        {installments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>هنوز قسطی ثبت نکرده‌ای</Text>
            <Text style={styles.emptyBody}>
              مبلغ هر قسط، تعداد اقساط و تاریخ اولین سررسید را بده؛ بقیه‌ی تاریخ‌ها را
              خودم با تقویم شمسی حساب می‌کنم.
            </Text>
          </Card>
        ) : null}

        {active.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            expanded={expandedId === plan.id}
            onToggleExpand={() => setExpandedId(current => (current === plan.id ? null : plan.id))}
            onEdit={() => navigation.navigate('AddInstallment', { id: plan.id })}
            onTogglePaid={number => togglePaid(plan.id, number)}
          />
        ))}

        {finished.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>تمام‌شده</Text>
            {finished.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expanded={expandedId === plan.id}
                onToggleExpand={() =>
                  setExpandedId(current => (current === plan.id ? null : plan.id))
                }
                onEdit={() => navigation.navigate('AddInstallment', { id: plan.id })}
                onTogglePaid={number => togglePaid(plan.id, number)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="افزودن قسط"
          onPress={() => navigation.navigate('AddInstallment', {})}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeLink}>
          <Text style={styles.closeText}>بستن</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

interface PlanCardProps {
  plan: Installment;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onTogglePaid: (number: number) => void;
}

function PlanCard({ plan, expanded, onToggleExpand, onEdit, onTogglePaid }: PlanCardProps) {
  const bank = findBank(plan.bank);
  const next = nextUnpaid(plan);
  const paidCount = plan.count - remainingCount(plan);
  const ratio = plan.count > 0 ? paidCount / plan.count : 0;
  const schedule = expanded ? expand(plan) : [];

  return (
    <Card style={styles.planCard}>
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.8} style={styles.planHead}>
        {bank ? <BankMark bank={bank} size={34} /> : null}

        <View style={styles.planTitleBox}>
          <Text style={styles.planTitle} numberOfLines={1}>
            {plan.title}
          </Text>
          <Text style={styles.planMeta}>
            {`${formatToman(plan.amount, false)} تومان در ${toFaDigits(plan.count)} قسط`}
          </Text>
        </View>

        <Text style={styles.chevron}>{expanded ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(ratio, 1) * 100}%` }]} />
      </View>

      <View style={styles.planStats}>
        <Text style={styles.planStat}>
          {`${toFaDigits(paidCount)} از ${toFaDigits(plan.count)} پرداخت شده`}
        </Text>
        <Text style={styles.planStat}>{`مانده ${formatTomanShort(remainingAmount(plan))}`}</Text>
      </View>

      {next ? (
        <View style={styles.nextRow}>
          <View style={styles.nextTextBox}>
            <Text style={styles.nextLabel}>
              {`قسط ${toFaDigits(next.number)} — ${formatJalaliDate(next.dueDate.toISOString())}`}
            </Text>
            <StatusBadge item={next} />
          </View>

          <TouchableOpacity onPress={() => onTogglePaid(next.number)} style={styles.payButton}>
            <Text style={styles.payText}>پرداخت شد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.done}>همه‌ی قسط‌ها پرداخت شده 🎉</Text>
      )}

      {expanded ? (
        <View style={styles.schedule}>
          {schedule.map(item => (
            <TouchableOpacity
              key={item.number}
              onPress={() => onTogglePaid(item.number)}
              style={styles.scheduleRow}>
              <View style={[styles.check, item.paid ? styles.checkOn : null]}>
                <Text style={styles.checkMark}>{item.paid ? '✓' : ''}</Text>
              </View>

              <Text style={[styles.scheduleDate, item.paid ? styles.scheduleDatePaid : null]}>
                {`${toFaDigits(item.number)}. ${formatJalaliDate(item.dueDate.toISOString())}`}
              </Text>

              <StatusBadge item={item} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onEdit} style={styles.editLink}>
            <Text style={styles.editText}>ویرایش این قسط</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Card>
  );
}

function StatusBadge({ item }: { item: DueInstallment }) {
  const tone = STATUS_TONE[item.status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel(item)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, gap: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md, alignSelf: 'stretch' },
  summaryLabel: { fontSize: 12, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text },

  emptyCard: { gap: spacing.xs },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textMuted, marginTop: spacing.md },

  planCard: { gap: spacing.sm },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planTitleBox: { flex: 1, gap: 2 },
  planTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  planMeta: { fontSize: 12, color: colors.textMuted },
  chevron: { fontSize: 12, color: colors.textMuted },

  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },

  planStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planStat: { fontSize: 12, color: colors.textFaint },

  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextTextBox: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  nextLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  payButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  payText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  done: { fontSize: 13, color: colors.success, fontWeight: '700' },

  schedule: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { fontSize: 12, color: '#FFFFFF', fontWeight: '800' },
  scheduleDate: { flex: 1, fontSize: 13, color: colors.text },
  scheduleDatePaid: { color: colors.textFaint },

  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },

  editLink: { alignItems: 'center', paddingVertical: spacing.md },
  editText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  closeLink: { alignItems: 'center', paddingVertical: spacing.sm },
  closeText: { color: colors.textMuted, fontSize: 13 },
});
