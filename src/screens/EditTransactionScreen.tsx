import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { TransactionFormFields } from '../components/TransactionFormFields';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { formatJalaliDate, formatTime, formatToman } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'EditTransaction'>;

/**
 * ویرایش و حذف یک تراکنش.
 *
 * همان فرمِ ثبت دستی است — `useTransactionForm` و `TransactionFormFields` —
 * فقط با مقدار اولیه پر می‌شود. حذف هم اینجاست نه روی خود ردیف: لمس ردیف
 * قبلاً مستقیم سراغ حذف می‌رفت که برای یک عمل برگشت‌ناپذیر تند بود.
 */
export function EditTransactionScreen({ navigation, route }: Props) {
  const { transactions, updateTransaction, removeTransaction } = useTransactions();
  const transaction = transactions.find(tx => tx.id === route.params.id) ?? null;

  const form = useTransactionForm(
    transaction
      ? {
          amount: transaction.amount,
          merchant: transaction.merchant,
          categoryId: transaction.categoryId,
          type: transaction.type,
          bank: transaction.bank ?? null,
          date: transaction.date,
        }
      : undefined,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  // اینجا هم می‌شود نشانش را زد یا برداشت — برای وقتی پیشنهاد لحظه‌ی تایید را
  // رد کرده یا اصلاً پیشنهادی نبوده (پیامک دوم دیر رسیده).
  const [internalTransfer, setInternalTransfer] = useState(transaction?.internalTransfer ?? false);

  // تراکنش ممکن است هم‌زمان از جای دیگری حذف شده باشد.
  if (!transaction) {
    return (
      <ScreenContainer>
        <FormScreenHeader title="تراکنش پیدا نشد" subtitle="این تراکنش دیگر وجود ندارد." />
        <FormFooter
          submitTitle="بستن"
          onSubmit={() => navigation.goBack()}
          disabled={false}
          error={null}
        />
      </ScreenContainer>
    );
  }

  function handleSave() {
    if (!form.canSave || !transaction) return;
    setSaveError(null);
    try {
      updateTransaction(transaction.id, {
        amount: form.amount,
        merchant: form.merchant.trim(),
        categoryId: form.categoryId,
        bank: form.bank ?? undefined,
        date: form.date.toISOString(),
        type: form.type,
        internalTransfer: internalTransfer || undefined,
      });
      navigation.goBack();
    } catch {
      setSaveError('ذخیره‌ی تغییرات ناموفق بود. دوباره تلاش کن.');
    }
  }

  function handleDelete() {
    if (!transaction) return;

    Alert.alert(
      'حذف تراکنش',
      `«${transaction.merchant}» به مبلغ ${formatToman(
        transaction.amount,
      )}\n\nاین تراکنش پاک می‌شود و برنمی‌گردد.`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            removeTransaction(transaction.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          title="ویرایش تراکنش"
          subtitle={`ثبت‌شده در ${formatJalaliDate(transaction.date)} · ${formatTime(
            transaction.date,
          )}`}
        />
        <TransactionFormFields
          form={form}
          onManageCategories={() => navigation.navigate('Categories')}
        />

        <View style={styles.transferRow}>
          <View style={styles.transferText}>
            <Text style={styles.transferTitle}>انتقال بین حساب‌های خودم</Text>
            <Text style={styles.transferBody}>
              در فهرست می‌ماند ولی در خرج و درآمد حساب نمی‌شود — برای کارت‌به‌کارت بین کارت‌های خودت.
            </Text>
          </View>
          <Switch
            value={internalTransfer}
            onValueChange={setInternalTransfer}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={internalTransfer ? colors.primary : colors.surface}
            accessibilityLabel="انتقال بین حساب‌های خودم"
          />
        </View>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteLink}>
          <Text style={styles.deleteText}>حذف این تراکنش</Text>
        </TouchableOpacity>
      </ScrollView>

      <FormFooter
        submitTitle="ذخیره‌ی تغییرات"
        onSubmit={handleSave}
        disabled={!form.canSave}
        error={saveError}
        onCancel={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  transferText: { flex: 1, gap: 2 },
  transferTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  transferBody: { fontSize: 11, color: colors.textMuted, lineHeight: 18 },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.md },
  deleteText: { fontSize: 13, fontWeight: '700', color: colors.expense },
});
