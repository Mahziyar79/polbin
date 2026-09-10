import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BankMark } from '../components/BankMark';
import { Card } from '../components/Card';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { JalaliDatePicker } from '../components/JalaliDatePicker';
import { PickerSheet } from '../components/PickerSheet';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';
import { BANKS, findBank } from '../data/banks';
import { normalizeAmountInput } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { dueDateOf } from '../services/installments';
import { useInstallments } from '../state/InstallmentsContext';
import { colors, radius, spacing } from '../theme';
import { Installment } from '../types';
import { formatJalaliDate, formatToman, toEnDigits, toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddInstallment'>;

/** بیشتر از این، هم غیرواقعی است و هم جدول اقساط را بی‌خود سنگین می‌کند. */
const MAX_COUNT = 120;

function digitsOnly(text: string): number {
  return Number(toEnDigits(text).replace(/[^\d]/g, '')) || 0;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * افزودن یا ویرایش یک برنامه‌ی قسطی.
 *
 * فقط چهار چیز پرسیده می‌شود: عنوان، مبلغ هر قسط، تعداد اقساط، و تاریخ اولین
 * سررسید. بقیه‌ی تاریخ‌ها ماه‌به‌ماه از روی همان اولی ساخته می‌شوند، پس کاربر
 * برای یک وام سه‌ساله سی‌وشش بار تاریخ وارد نمی‌کند.
 */
export function AddInstallmentScreen({ navigation, route }: Props) {
  const editingId = route.params?.id ?? null;
  const { installments, add, update, remove } = useInstallments();
  const editing = editingId ? installments.find(item => item.id === editingId) ?? null : null;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [amountText, setAmountText] = useState(
    editing ? normalizeAmountInput(String(editing.amount)) : '',
  );
  const [countText, setCountText] = useState(editing ? toFaDigits(editing.count) : '');
  const [bank, setBank] = useState<string | null>(editing?.bank ?? null);
  const [firstDue, setFirstDue] = useState<Date>(
    editing ? new Date(editing.firstDueDate) : startOfToday(),
  );

  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const amount = digitsOnly(amountText);
  const count = digitsOnly(countText);
  const selectedBank = findBank(bank);

  const error = useMemo(() => {
    if (title.trim().length === 0) return 'یک عنوان بگذار، مثلاً «وام مسکن».';
    if (amount <= 0) return 'مبلغ هر قسط را وارد کن.';
    if (count <= 0) return 'تعداد اقساط را وارد کن.';
    if (count > MAX_COUNT) return `تعداد اقساط نمی‌تواند بیشتر از ${toFaDigits(MAX_COUNT)} باشد.`;
    return null;
  }, [title, amount, count]);

  /** پیش‌نمایش سررسید آخرین قسط — تنها راهِ فهمیدن اینکه تاریخ‌ها درست درآمده‌اند. */
  const lastDue = useMemo(() => {
    if (count <= 0 || count > MAX_COUNT) return null;

    const plan: Installment = {
      id: 'preview',
      title,
      amount,
      count,
      firstDueDate: firstDue.toISOString(),
      paid: [],
    };

    return dueDateOf(plan, count);
  }, [title, amount, count, firstDue]);

  function handleSave() {
    if (error) return;

    const payload = {
      title: title.trim(),
      amount,
      count,
      firstDueDate: firstDue.toISOString(),
      bank: bank ?? undefined,
    };

    if (editing) {
      // قسط‌های پرداخت‌شده‌ای که دیگر وجود ندارند حذف می‌شوند، وگرنه شمارش
      // «۵ از ۳ پرداخت شده» می‌شد.
      update(editing.id, { ...payload, paid: editing.paid.filter(number => number <= count) });
    } else {
      add(payload);
    }

    navigation.goBack();
  }

  function handleDelete() {
    if (!editing) return;

    // متن با واژه‌ی فارسی شروع می‌شود تا عنوان لاتین جهت سطر را برنگرداند.
    Alert.alert('حذف قسط', `جدول اقساط «${editing.title}» حذف شود؟`, [
      { text: 'بی‌خیال', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          remove(editing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          title={editing ? 'ویرایش قسط' : 'افزودن قسط'}
          subtitle="تاریخ اولین سررسید را بده؛ بقیه‌ی سررسیدها ماه‌به‌ماه شمسی حساب می‌شوند."
        />

        <Card style={styles.card}>
          <Text style={styles.label}>عنوان</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="وام مسکن، گوشی، بیمه…"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>مبلغ هر قسط (تومان)</Text>
          <TextInput
            value={amountText}
            onChangeText={text => setAmountText(normalizeAmountInput(text))}
            placeholder="۰"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            style={[styles.input, styles.amountInput]}
            textAlign="center"
          />
          {amount > 0 ? <Text style={styles.echo}>{formatToman(amount)}</Text> : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>تعداد اقساط</Text>
          <TextInput
            value={countText}
            onChangeText={text => setCountText(toFaDigits(toEnDigits(text).replace(/[^\d]/g, '')))}
            placeholder="۳۶"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            style={[styles.input, styles.amountInput]}
            textAlign="center"
          />
          {count > 0 && amount > 0 && count <= MAX_COUNT ? (
            <Text style={styles.echo}>{`مجموع ${formatToman(amount * count)}`}</Text>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>اولین سررسید</Text>
          <TouchableOpacity onPress={() => setDatePickerOpen(true)} style={styles.pickerRow}>
            <Text style={styles.pickerValue}>📅  {formatJalaliDate(firstDue.toISOString())}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>

          {lastDue ? (
            <Text style={styles.echo}>
              {`آخرین قسط: ${formatJalaliDate(lastDue.toISOString())}`}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>بانک (اختیاری)</Text>
          <TouchableOpacity onPress={() => setBankPickerOpen(true)} style={styles.pickerRow}>
            {selectedBank ? (
              <BankMark bank={selectedBank} size={28} />
            ) : (
              <View style={styles.bankPlaceholder} />
            )}
            <Text style={styles.pickerValue} numberOfLines={1}>
              {selectedBank ? selectedBank.name : 'انتخاب نشده'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </Card>

        {editing ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteLink}>
            <Text style={styles.deleteText}>حذف این قسط</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>

      <FormFooter
        submitTitle={editing ? 'ذخیره‌ی تغییرات' : 'افزودن'}
        onSubmit={handleSave}
        disabled={error !== null}
        error={null}
        onCancel={() => navigation.goBack()}
      />

      <JalaliDatePicker
        visible={datePickerOpen}
        value={firstDue}
        title="اولین سررسید"
        onSelect={date => {
          setFirstDue(date);
          setDatePickerOpen(false);
        }}
        onClose={() => setDatePickerOpen(false)}
      />

      <PickerSheet
        visible={bankPickerOpen}
        title="بانک"
        selectedId={bank ?? 'none'}
        options={[
          { id: 'none', label: 'انتخاب نشده' },
          ...BANKS.map(item => ({
            id: item.name,
            label: item.name,
            leading: <BankMark bank={item} size={28} />,
          })),
        ]}
        onSelect={id => {
          setBank(id === 'none' ? null : id);
          setBankPickerOpen(false);
        }}
        onClose={() => setBankPickerOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  label: { fontSize: 13, color: colors.textMuted },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  amountInput: { height: 60, fontSize: 22, fontWeight: '800' },
  echo: { fontSize: 12, color: colors.textFaint, textAlign: 'center' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickerValue: { flex: 1, fontSize: 14, color: colors.text },
  chevron: { fontSize: 12, color: colors.textMuted },
  bankPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.md },
  deleteText: { fontSize: 13, fontWeight: '700', color: colors.expense },
  spacer: { height: spacing.xl },
});
