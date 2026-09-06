import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionFormFields } from '../components/TransactionFormFields';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { useTransactions } from '../state/TransactionsContext';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export function AddTransactionScreen({ navigation }: Props) {
  const { addTransaction } = useTransactions();
  const form = useTransactionForm();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addTransaction({
        amount: form.amount,
        merchant: form.merchant.trim(),
        categoryId: form.categoryId,
        date: new Date().toISOString(),
        type: 'debit',
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
          subtitle="خرجی که پیامکش نیامده را دستی ثبت کن."
        />
        <TransactionFormFields
          form={form}
          autoFocusAmount
          onManageCategories={() => navigation.navigate('Categories')}
        />
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
});
