import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../state/CategoriesContext';
import { TransactionForm } from '../hooks/useTransactionForm';
import { colors, radius, spacing } from '../theme';
import { formatToman } from '../utils/format';
import { Card } from './Card';
import { Text } from './Text';
import { TextInput } from './TextInput';

interface Props {
  form: TransactionForm;
  /** زیر فیلد مبلغ رندر می‌شود — مثلاً نوار اطمینان پارسر. */
  amountFooter?: React.ReactNode;
  /** انتهای کارت دوم رندر می‌شود — مثلاً نام بانک و شماره کارت. */
  meta?: React.ReactNode;
  autoFocusAmount?: boolean;
  /** وقتی داده شود، یک چیپ «دسته‌ی جدید» ته لیست اضافه می‌شود. */
  onManageCategories?: () => void;
}

const TYPES = [
  { value: 'debit', label: 'خرج', color: colors.expense, tint: colors.expenseSoft },
  { value: 'credit', label: 'درآمد', color: colors.success, tint: colors.successSoft },
] as const;

/**
 * فیلدهای مشترک تراکنش: مبلغ، پذیرنده، دسته‌بندی.
 * هم صفحه‌ی تایید پیامک و هم صفحه‌ی افزودن دستی از همین استفاده می‌کنند؛
 * تفاوت‌هایشان از طریق اسلات‌های `amountFooter` و `meta` تزریق می‌شود.
 */
export function TransactionFormFields({
  form,
  amountFooter,
  meta,
  autoFocusAmount,
  onManageCategories,
}: Props) {
  const { categoriesOfKind } = useCategories();
  const categories = categoriesOfKind(form.type);

  return (
    <>
      <Card style={styles.amountCard}>
        <View style={styles.typeSwitch}>
          {TYPES.map(option => {
            const active = option.value === form.type;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => form.setType(option.value)}
                style={[
                  styles.typeChip,
                  active ? { backgroundColor: option.tint, borderColor: option.color } : null,
                ]}>
                <Text style={[styles.typeText, active ? { color: option.color } : null]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>مبلغ (تومان)</Text>
        <TextInput
          value={form.amountText}
          onChangeText={form.setAmountText}
          keyboardType="number-pad"
          style={styles.amountInput}
          textAlign="center"
          autoFocus={autoFocusAmount}
        />
        <Text
          style={[styles.amountPreview, form.type === 'credit' ? styles.amountIncome : null]}>
          {form.type === 'credit' ? '+ ' : ''}
          {formatToman(form.amount)}
        </Text>
        {amountFooter}
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.fieldLabel}>
          {form.type === 'credit' ? 'منبع درآمد' : 'فروشگاه / پذیرنده'}
        </Text>
        <TextInput
          value={form.merchant}
          onChangeText={form.setMerchant}
          placeholder={form.type === 'credit' ? 'مثلاً حقوق شهریور' : 'مثلاً اسنپ‌فود'}
          placeholderTextColor={colors.textFaint}
          style={styles.textInput}
        />

        <Text style={[styles.fieldLabel, styles.spacedLabel]}>دسته‌بندی</Text>
        <View style={styles.chips}>
          {categories.map(category => {
            const active = category.id === form.categoryId;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => form.setCategoryId(category.id)}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: category.color + '22', borderColor: category.color }
                    : null,
                ]}>
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                  {category.emoji}  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {onManageCategories ? (
            <TouchableOpacity style={[styles.chip, styles.manageChip]} onPress={onManageCategories}>
              <Text style={styles.manageChipText}>＋  دسته‌ی جدید</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {meta}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  amountCard: { alignItems: 'stretch', gap: spacing.sm },
  typeSwitch: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  typeText: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  amountIncome: { color: colors.success },
  gap: { gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  spacedLabel: { marginTop: spacing.md },
  amountInput: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  amountPreview: { textAlign: 'center', color: colors.textFaint, fontSize: 13 },
  textInput: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.text, fontWeight: '800' },
  manageChip: { borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: 'transparent' },
  manageChipText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
});
