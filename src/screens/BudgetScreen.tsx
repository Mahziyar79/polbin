import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';
import { normalizeAmountInput } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { withinJalaliMonth } from '../services/analytics';
import { useBudget } from '../state/BudgetContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { formatToman, formatTomanShort, toEnDigits, toFaDigits } from '../utils/format';
import { jalaliMonthName } from '../utils/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Budget'>;

/** میانگین خرج ماه‌های قبل، گرد شده به بالا — پیشنهاد اولیه‌ی معقول. */
function suggestion(previousMonths: number[]): number | null {
  const months = previousMonths.filter(total => total > 0);
  if (months.length === 0) return null;

  const average = months.reduce((sum, total) => sum + total, 0) / months.length;
  return Math.ceil(average / 100_000) * 100_000;
}

export function BudgetScreen({ navigation }: Props) {
  const { monthly, setMonthly, clear } = useBudget();
  const { transactions } = useTransactions();

  const [amountText, setAmountText] = useState(
    monthly ? normalizeAmountInput(String(monthly)) : '',
  );

  const spendOf = (monthsBack: number) =>
    withinJalaliMonth(transactions, monthsBack)
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

  const suggested = suggestion([spendOf(1), spendOf(2), spendOf(3)]);
  const amount = Number(toEnDigits(amountText).replace(/[^\d]/g, '')) || 0;

  function handleSave() {
    if (amount <= 0) return;
    setMonthly(amount);
    navigation.goBack();
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          title="سقف خرج ماهانه"
          subtitle={`چقدر می‌خواهی در ${jalaliMonthName(new Date())} خرج کنی؟ هر وقت خواستی عوضش کن.`}
        />

        <Card style={styles.card}>
          <Text style={styles.label}>سقف (تومان)</Text>
          <TextInput
            value={amountText}
            onChangeText={text => setAmountText(normalizeAmountInput(text))}
            placeholder="۰"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            style={styles.input}
            textAlign="center"
            autoFocus
          />
          {amount > 0 ? <Text style={styles.echo}>{formatToman(amount)}</Text> : null}
        </Card>

        {suggested ? (
          <TouchableOpacity onPress={() => setAmountText(normalizeAmountInput(String(suggested)))}>
            <Card style={styles.suggestion}>
              <Text style={styles.suggestionTitle}>بر اساس ماه‌های قبلت</Text>
              <Text style={styles.suggestionBody}>
                میانگین خرج ماهانه‌ات حدود {formatTomanShort(suggested)} بوده. برای شروع همین
                عدد منطقی است.
              </Text>
              <Text style={styles.suggestionAction}>
                گذاشتن {toFaDigits(formatToman(suggested, false))} تومان ←
              </Text>
            </Card>
          </TouchableOpacity>
        ) : (
          <Text style={styles.note}>
            هنوز آن‌قدر تراکنش نداری که پیشنهادی بدهم. یک عدد تقریبی بگذار؛ ماه بعد با
            داده‌ی واقعی اصلاحش می‌کنی.
          </Text>
        )}

        {monthly !== null ? (
          <TouchableOpacity
            onPress={() => {
              clear();
              navigation.goBack();
            }}
            style={styles.clearLink}>
            <Text style={styles.clearText}>برداشتن سقف</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>

      <FormFooter
        submitTitle="ذخیره"
        onSubmit={handleSave}
        disabled={amount <= 0}
        error={null}
        onCancel={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  label: { fontSize: 13, color: colors.textMuted },
  input: {
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  echo: { fontSize: 12, color: colors.textFaint, textAlign: 'center' },
  suggestion: { gap: spacing.xs, backgroundColor: colors.primarySoft, borderColor: colors.primary },
  suggestionTitle: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  suggestionBody: { fontSize: 12, color: colors.text, lineHeight: 22 },
  suggestionAction: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 2 },
  note: { fontSize: 12, color: colors.textFaint, lineHeight: 22, paddingHorizontal: spacing.xs },
  clearLink: { alignItems: 'center', paddingVertical: spacing.md },
  clearText: { fontSize: 13, fontWeight: '700', color: colors.expense },
  spacer: { height: spacing.xl },
});
