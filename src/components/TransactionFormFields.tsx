import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BANKS, findBank } from '../data/banks';
import { useCategories } from '../state/CategoriesContext';
import { TransactionForm } from '../hooks/useTransactionForm';
import { colors, radius, spacing } from '../theme';
import { formatJalaliDate, formatTime, formatToman } from '../utils/format';
import { BankMark } from './BankMark';
import { JalaliDatePicker } from './JalaliDatePicker';
import { Card } from './Card';
import { PickerSheet } from './PickerSheet';
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

/** نام پیش‌فرض انتقال، وقتی کاربر «انتقال» را می‌زند و فیلد خالی است. */
const TRANSFER_MERCHANT = 'انتقال بین حساب‌ها';

const COUNTING_MODES = [
  { transfer: false, label: 'در محاسبه بیاید' },
  { transfer: true, label: 'انتقال بین حساب‌ها' },
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

  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const selectedBank = findBank(form.bank);

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

        {/*
          نحوه‌ی محاسبه مستقل از جهت خرج/درآمد است.
          خرج و درآمد پاک نمی‌شوند چون جهت پول حتی در انتقال هم معنی دارد: یک سرِ
          انتقال از حساب بیرون می‌رود و سر دیگر وارد حساب دیگری می‌شود، و موجودی
          هر کارت روی همین حساب می‌شود.
        */}
        <View style={styles.countingGroup}>
          <Text style={styles.countingLabel}>نحوه‌ی محاسبه</Text>
          <View style={styles.countingSwitch} accessibilityRole="radiogroup" accessibilityLabel="نحوه‌ی محاسبه">
            {COUNTING_MODES.map(option => {
              const active = form.internalTransfer === option.transfer;
              return (
                <TouchableOpacity
                  key={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  activeOpacity={0.75}
                  onPress={() => {
                    form.setInternalTransfer(option.transfer);
                    // بدون نام، دکمه‌ی ثبت خاموش می‌ماند؛ برای انتقال اسمش از قبل معلوم است.
                    if (option.transfer && form.merchant.trim().length === 0) {
                      form.setMerchant(TRANSFER_MERCHANT);
                    }
                  }}
                  style={[styles.countingOption, active ? styles.countingOptionActive : null]}>
                  <View style={[styles.radio, active ? styles.radioActive : null]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.countText, active ? styles.countTextOn : null]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {form.internalTransfer ? (
          <Text style={styles.transferHint}>
            در فهرست تراکنش‌ها می‌ماند، ولی روی مجموع خرج و درآمد و تفکیک دسته اثری ندارد.
          </Text>
        ) : null}

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

        {/* بانک اختیاری است: خیلی خرج‌ها نقدی‌اند و بانکی ندارند. */}
        <Text style={[styles.fieldLabel, styles.spacedLabel]}>بانک (اختیاری)</Text>
        <TouchableOpacity onPress={() => setBankPickerOpen(true)} style={styles.bankRow}>
          {selectedBank ? (
            <BankMark bank={selectedBank} size={28} />
          ) : (
            <View style={styles.bankPlaceholder} />
          )}
          <Text style={styles.bankLabel} numberOfLines={1}>
            {selectedBank ? selectedBank.name : 'انتخاب بانک'}
          </Text>
          <Text style={styles.bankChevron}>▾</Text>
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, styles.spacedLabel]}>تاریخ و ساعت</Text>
        <TouchableOpacity onPress={() => setDatePickerOpen(true)} style={styles.bankRow}>
          <Text style={styles.dateEmoji}>📅</Text>
          <Text style={styles.bankLabel} numberOfLines={1}>
            {`${formatJalaliDate(form.date.toISOString())}، ${formatTime(form.date.toISOString())}`}
          </Text>
          <Text style={styles.bankChevron}>▾</Text>
        </TouchableOpacity>

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
      <PickerSheet
        visible={bankPickerOpen}
        title="بانک تراکنش"
        selectedId={form.bank ?? 'none'}
        options={[
          { id: 'none', label: 'بدون بانک' },
          ...BANKS.map(bank => ({
            id: bank.name,
            label: bank.name,
            leading: <BankMark bank={bank} size={28} />,
          })),
        ]}
        onSelect={id => {
          form.setBank(id === 'none' ? null : id);
          setBankPickerOpen(false);
        }}
        onClose={() => setBankPickerOpen(false)}
      />

      <JalaliDatePicker
        visible={datePickerOpen}
        value={form.date}
        title="تاریخ و ساعت تراکنش"
        withTime
        onSelect={date => {
          form.setDate(date);
          setDatePickerOpen(false);
        }}
        onClose={() => setDatePickerOpen(false)}
      />
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
  countingGroup: { gap: spacing.xs, marginBottom: spacing.xs },
  countingLabel: { fontSize: 11, color: colors.textMuted },
  countingSwitch: { flexDirection: 'row', gap: spacing.xs, padding: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  countingOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  countingOptionActive: { backgroundColor: colors.surface, borderColor: colors.primary, shadowColor: colors.primaryDark, shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  radio: { width: 16, height: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
  countText: { flex: 1, fontSize: 12, lineHeight: 20, fontWeight: '700', color: colors.textMuted },
  countTextOn: { color: colors.primaryDark },
  transferHint: { fontSize: 12, color: colors.primaryDark, lineHeight: 21, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft },
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
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bankPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  bankLabel: { flex: 1, fontSize: 14, color: colors.text },
  bankChevron: { fontSize: 12, color: colors.textMuted },
  dateEmoji: { fontSize: 18 },
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
