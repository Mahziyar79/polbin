import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { JalaliDatePicker } from '../components/JalaliDatePicker';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { backupFileName, buildBackup, parseBackup } from '../services/backup';
import {
  isAvailable,
  pickTextFile,
  printHtml,
  saveAndShare,
  saveAndShareBytes,
} from '../services/deviceFiles';
import { buildReportHtml } from '../services/reportHtml';
import { buildTransactionsXlsx, xlsxFileName } from '../services/xlsx';
import { useBudget } from '../state/BudgetContext';
import { useInstallments } from '../state/InstallmentsContext';
import { useCategories } from '../state/CategoriesContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { formatJalaliDate, toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Backup'>;

type Job = 'export' | 'import' | 'pdf' | 'xlsx';

export function BackupScreen({ navigation }: Props) {
  const { transactions, replaceAll } = useTransactions();
  const { categories, customCategories, replaceCustom } = useCategories();
  const { monthly, setMonthly, clear: clearBudget } = useBudget();
  const { installments, replaceAll: replaceInstallments } = useInstallments();

  const [busy, setBusy] = useState<Job | null>(null);

  /**
   * «تا تاریخ» برای هر سه خروجی. null یعنی همه‌چیز. برای پشتیبان JSON هم اعمال
   * می‌شود چون کاربر خواست، ولی متن کارت هشدار می‌دهد که تراکنش‌های بعد از آن
   * تاریخ در فایل نیستند — پشتیبان ناقص، بدتر از نداشتن پشتیبان است.
   */
  const [until, setUntil] = useState<Date | null>(null);
  const [untilPickerOpen, setUntilPickerOpen] = useState(false);

  const exported = useMemo(() => {
    if (!until) return transactions;
    const limit = new Date(until);
    limit.setHours(23, 59, 59, 999);
    return transactions.filter(tx => new Date(tx.date).getTime() <= limit.getTime());
  }, [transactions, until]);
  const [message, setMessage] = useState<string | null>(null);

  async function run(kind: Job, action: () => Promise<void>) {
    setBusy(kind);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const handleExport = () =>
    run('export', async () => {
      const json = buildBackup({
        transactions: exported,
        customCategories,
        monthlyBudget: monthly,
        installments,
      });
      await saveAndShare(backupFileName(), 'application/json', json);
    });

  const handleXlsx = () =>
    run('xlsx', async () => {
      const bytes = buildTransactionsXlsx(exported, categories);
      await saveAndShareBytes(
        xlsxFileName(),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        bytes,
      );
    });

  const handlePdf = () =>
    run('pdf', async () => {
      const html = buildReportHtml({
        transactions: exported,
        categories,
        periodLabel: until
          ? `${toFaDigits(exported.length)} تراکنش تا ${formatJalaliDate(until.toISOString())}`
          : `${toFaDigits(exported.length)} تراکنش`,
      });
      await printHtml(html, 'گزارش پول‌بین');
    });

  const handleImport = () =>
    run('import', async () => {
      const raw = await pickTextFile();
      if (raw === null) return;

      const result = parseBackup(raw);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      const { contents } = result;

      // بازگردانی داده‌ی فعلی را دور می‌ریزد، پس باید صریح تایید شود.
      Alert.alert(
        'بازگردانی پشتیبان',
        `${toFaDigits(contents.transactions.length)} تراکنش و ${toFaDigits(
          contents.customCategories.length,
        )} دسته و ${toFaDigits(
          contents.installments.length,
        )} قسط در فایل هست.\n\nداده‌ی فعلی روی گوشی جایگزین می‌شود و برنمی‌گردد.`,
        [
          { text: 'انصراف', style: 'cancel' },
          {
            text: 'جایگزین کن',
            style: 'destructive',
            onPress: () => {
              replaceCustom(contents.customCategories);
              replaceAll(contents.transactions);
              replaceInstallments(contents.installments);
              if (contents.monthlyBudget === null) {
                clearBudget();
              } else {
                setMonthly(contents.monthlyBudget);
              }
              setMessage('بازگردانی انجام شد.');
            },
          },
        ],
      );
    });

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content}>
        <FormScreenHeader
          onBack={() => navigation.goBack()}
          title="پشتیبان‌گیری و خروجی"
          subtitle="داده‌ی پول‌بین فقط روی همین گوشی است. یک نسخه‌ی پشتیبان بگیر تا با عوض کردن گوشی از دستش ندهی."
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>تا چه تاریخی؟</Text>
          <Text style={styles.cardBody}>
            هر سه خروجی زیر تراکنش‌های تا این تاریخ را می‌گیرند.
            {until ? ' تراکنش‌های بعد از آن در فایل نخواهند بود.' : ' الان همه‌ی تراکنش‌ها.'}
          </Text>
          <View style={styles.untilRow}>
            <TouchableOpacity onPress={() => setUntilPickerOpen(true)} style={styles.untilButton}>
              <Text style={styles.untilText}>
                {until ? `📅  تا ${formatJalaliDate(until.toISOString())}` : '📅  انتخاب تاریخ'}
              </Text>
            </TouchableOpacity>
            {until ? (
              <TouchableOpacity onPress={() => setUntil(null)} style={styles.untilClear}>
                <Text style={styles.untilClearText}>همه</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>

        {isAvailable() ? null : (
          <Card style={styles.warning}>
            <Text style={styles.warningText}>
              ماژول فایل در دسترس نیست. اپ را دوباره نصب کن (بیلد نیتیو لازم است).
            </Text>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>پشتیبان کامل</Text>
          <Text style={styles.cardBody}>
            یک فایل JSON شامل {toFaDigits(exported.length)} تراکنش و{' '}
            {toFaDigits(customCategories.length)} دسته‌ی دلخواه. همین فایل را می‌شود بعداً
            برگرداند.
          </Text>
          <AppButton
            title="گرفتن فایل پشتیبان"
            onPress={handleExport}
            loading={busy === 'export'}
            disabled={busy !== null}
          />
          <TouchableOpacity onPress={handleImport} disabled={busy !== null} style={styles.link}>
            <Text style={styles.linkText}>
              {busy === 'import' ? 'در حال خواندن فایل…' : 'بازگردانی از فایل پشتیبان'}
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>خروجی اکسل</Text>
          <Text style={styles.cardBody}>
            همه‌ی تراکنش‌ها در یک فایل xlsx: تاریخ شمسی، مبلغ، فروشگاه، دسته و بانک. مبلغ‌ها عدد
            واقعی‌اند تا بشود رویشان جمع زد. متن پیامک‌ها داخلش نیست.
          </Text>
          <AppButton
            title="گرفتن فایل اکسل"
            onPress={handleXlsx}
            variant="secondary"
            loading={busy === 'xlsx'}
            disabled={busy !== null || exported.length === 0}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>گزارش PDF</Text>
          <Text style={styles.cardBody}>
            جدول همه‌ی تراکنش‌ها با جمع درآمد، هزینه و مانده. پنجره‌ی چاپ اندروید باز می‌شود و
            از همان‌جا «ذخیره به‌صورت PDF» را بزن.
          </Text>
          <AppButton
            title="ساختن گزارش"
            onPress={handlePdf}
            variant="secondary"
            loading={busy === 'pdf'}
            disabled={busy !== null || exported.length === 0}
          />
        </Card>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <JalaliDatePicker
        visible={untilPickerOpen}
        value={until ?? new Date()}
        title="خروجی تا تاریخ"
        onSelect={date => {
          setUntil(date);
          setUntilPickerOpen(false);
        }}
        onClose={() => setUntilPickerOpen(false)}
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  warning: { backgroundColor: colors.expenseSoft, borderColor: colors.expense },
  warningText: { fontSize: 13, color: colors.expense, lineHeight: 24 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 24, marginBottom: spacing.xs },
  untilRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  untilButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  untilText: { fontSize: 14, color: colors.text },
  untilClear: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  untilClearText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  message: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    lineHeight: 24,
  },
});
