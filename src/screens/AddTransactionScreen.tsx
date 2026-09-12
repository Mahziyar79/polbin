import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { describeTransaction } from '../components/DuplicateCard';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { TransactionFormFields } from '../components/TransactionFormFields';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { findDuplicate } from '../services/duplicates';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export function AddTransactionScreen({ navigation }: Props) {
  const { transactions, addTransaction } = useTransactions();
  const form = useTransactionForm();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * فقط یک یادآوری نرم، بدون دکمه، و فقط در برابر تراکنش‌هایی که از پیامک
   * آمده‌اند. حالت واقعی این است: پیامک خودکار ثبت شده و کاربر یادش رفته و
   * دارد همان خرج را دستی می‌زند. دو خرج دستیِ هم‌مبلغ در یک روز (دو قهوه)
   * کاملاً عادی است و نباید هشداری بگیرد.
   */
  const fromSms = useMemo(() => transactions.filter(tx => tx.rawSms), [transactions]);
  const lookalike = useMemo(
    () =>
      form.amount > 0
        ? findDuplicate(
            { amount: form.amount, type: form.type, date: form.date.toISOString(), bank: form.bank },
            fromSms,
          )
        : null,
    [form.amount, form.type, form.bank, form.date, fromSms],
  );

  async function handleSave() {
    if (!form.canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addTransaction({
        amount: form.amount,
        merchant: form.merchant.trim(),
        categoryId: form.categoryId,
        bank: form.bank ?? undefined,
        date: form.date.toISOString(),
        type: form.type,
      });
      navigation.navigate('Dashboard');
    } catch {
      setSaveError('ثبت تراکنش ناموفق بود. دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          title="تراکنش جدید"
          subtitle="خرج یا درآمدی که پیامکش نیامده را دستی ثبت کن."
        />
        <TransactionFormFields
          form={form}
          autoFocusAmount
          onManageCategories={() => navigation.navigate('Categories')}
        />

        {lookalike ? (
          <Text style={styles.lookalike}>
            {`همان روز یک ${form.type === 'debit' ? 'خرج' : 'درآمد'} با همین مبلغ از پیامک بانک ثبت شده: ${describeTransaction(lookalike.existing)}. اگر همان است، دوباره ثبتش نکن.`}
          </Text>
        ) : null}
      </ScrollView>

      <FormFooter
        submitTitle="ثبت تراکنش"
        onSubmit={handleSave}
        loading={saving}
        disabled={!form.canSave}
        error={saveError}
        onCancel={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  lookalike: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 22,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FFF7E0',
  },
});
