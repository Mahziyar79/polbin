import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { backupFileName, buildBackup, parseBackup } from '../services/backup';
import { isAvailable, pickTextFile, printHtml, saveAndShare } from '../services/deviceFiles';
import { buildReportHtml } from '../services/reportHtml';
import { useCategories } from '../state/CategoriesContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Backup'>;

export function BackupScreen({ navigation }: Props) {
  const { transactions, replaceAll } = useTransactions();
  const { categories, customCategories, replaceCustom } = useCategories();

  const [busy, setBusy] = useState<'export' | 'import' | 'pdf' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(kind: 'export' | 'import' | 'pdf', action: () => Promise<void>) {
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
      const json = buildBackup({ transactions, customCategories });
      await saveAndShare(backupFileName(), 'application/json', json);
    });

  const handlePdf = () =>
    run('pdf', async () => {
      const html = buildReportHtml({
        transactions,
        categories,
        periodLabel: `${toFaDigits(transactions.length)} تراکنش`,
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
        )} دسته در فایل هست.\n\nداده‌ی فعلی روی گوشی جایگزین می‌شود و برنمی‌گردد.`,
        [
          { text: 'انصراف', style: 'cancel' },
          {
            text: 'جایگزین کن',
            style: 'destructive',
            onPress: () => {
              replaceCustom(contents.customCategories);
              replaceAll(contents.transactions);
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
          title="پشتیبان و خروجی"
          subtitle="داده‌ی پول‌بین فقط روی همین گوشی است. یک نسخه‌ی پشتیبان بگیر تا با عوض کردن گوشی از دستش ندهی."
        />

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
            یک فایل JSON شامل {toFaDigits(transactions.length)} تراکنش و{' '}
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
            disabled={busy !== null || transactions.length === 0}
          />
        </Card>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
