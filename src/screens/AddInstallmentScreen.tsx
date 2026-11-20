import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
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
import { INSTALLMENT_KINDS } from '../data/installmentKinds';
import { normalizeAmountInput } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { dueDateOf } from '../services/installments';
import { requestNotificationPermission } from '../services/smsPermission';
import { useInstallments } from '../state/InstallmentsContext';
import { colors, radius, spacing } from '../theme';
import { Installment, InstallmentKind } from '../types';
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
 * خرید قسطی مستقل از وام ثبت می‌شود؛ بانک برای خرید لازم نیست. سررسیدهای
 * ماهانه از اولین قسط ساخته می‌شوند و پرداخت‌های قبلی هم قابل ثبت‌اند.
 */
export function AddInstallmentScreen({ navigation, route }: Props) {
  const editingId = route.params?.id ?? null;
  const { installments, add, update, remove } = useInstallments();
  const editing = editingId ? installments.find(item => item.id === editingId) ?? null : null;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [kind, setKind] = useState<InstallmentKind>(editing?.kind ?? (editing ? 'other' : 'purchase'));
  const [counterparty, setCounterparty] = useState(editing?.counterparty ?? '');
  const [chequeNumber, setChequeNumber] = useState(editing?.chequeNumber ?? '');
  const [moreOpen, setMoreOpen] = useState(false);
  const [paidCountText, setPaidCountText] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(editing?.reminderEnabled ?? false);
  const [reminderPermissionBusy, setReminderPermissionBusy] = useState(false);
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
  const isCheque = kind === 'cheque';
  const count = isCheque ? 1 : digitsOnly(countText);
  const initialPaidCount = isCheque ? 0 : digitsOnly(paidCountText);
  const selectedBank = findBank(bank);

  const error = useMemo(() => {
    if (title.trim().length === 0) return 'یک عنوان بگذار، مثلاً «موبایل».';
    if (!Number.isSafeInteger(amount) || amount <= 0) return 'مبلغ معتبر هر قسط را وارد کن.';
    if (count <= 0) return 'تعداد اقساط را وارد کن.';
    if (count > MAX_COUNT) return `تعداد اقساط نمی‌تواند بیشتر از ${toFaDigits(MAX_COUNT)} باشد.`;
    if (!editing && initialPaidCount > count) return 'تعداد پرداخت‌شده نمی‌تواند بیشتر از کل اقساط باشد.';
    return null;
  }, [title, amount, count, editing, initialPaidCount]);

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
      kind: editing && !editing.kind && kind === 'other' ? undefined : kind,
      counterparty: counterparty.trim() || undefined,
      chequeNumber: chequeNumber.trim() || undefined,
      reminderEnabled: editing?.reminderEnabled === undefined && !reminderEnabled ? undefined : reminderEnabled,
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
      add({ ...payload, paid: Array.from({ length: initialPaidCount }, (_, index) => index + 1) });
    }

    navigation.goBack();
  }

  function handleDelete() {
    if (!editing) return;

    // متن با واژه‌ی فارسی شروع می‌شود تا عنوان لاتین جهت سطر را برنگرداند.
    Alert.alert(isCheque ? 'حذف چک' : 'حذف اقساط', `مورد «${editing.title}» حذف شود؟`, [
      { text: 'بازگشت', style: 'cancel' },
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
          onBack={() => navigation.goBack()}
          title={editing ? (isCheque ? 'ویرایش چک' : 'ویرایش اقساط') : 'ثبت اقساط یا چک'}
          subtitle={isCheque ? 'مبلغ و سررسید چک پرداختی‌ات را ثبت کن.' : 'مبلغ ماهانه، تعداد و اولین سررسید را وارد کن.'}
        />

        <View style={styles.kindRow}>
          {[...INSTALLMENT_KINDS, ...(kind === 'other' ? [{ id: 'other' as const, label: 'اقساط قبلی', emoji: '📁' }] : [])].map(item => (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: kind === item.id }}
              onPress={() => {
                if (item.id === 'cheque' && editing && editing.count > 1) {
                  Alert.alert('چک جداگانه ثبت کن', 'این مورد چند قسط دارد. برای حفظ جدول پرداخت‌های قبلی، چک را به‌صورت مورد تازه ثبت کن.');
                  return;
                }
                setKind(item.id);
              }}
              style={[styles.kindOption, kind === item.id && styles.kindSelected]}>
              <Text style={styles.kindEmoji}>{item.emoji}</Text>
              <Text style={[styles.kindLabel, kind === item.id && styles.kindLabelSelected]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>عنوان</Text>
          <TextInput accessibilityLabel="عنوان" value={title} onChangeText={setTitle}
            placeholder={isCheque ? 'مثلاً چک خرید لوازم خانه' : kind === 'loan' ? 'مثلاً وام مسکن' : 'مثلاً موبایل'}
            maxLength={80} placeholderTextColor={colors.textFaint} style={styles.input} />

          <Text style={styles.label}>{isCheque ? 'مبلغ چک (تومان)' : 'مبلغ هر قسط (تومان)'}</Text>
          <TextInput accessibilityLabel={isCheque ? 'مبلغ چک' : 'مبلغ هر قسط'}
            value={amountText} onChangeText={text => setAmountText(normalizeAmountInput(text))}
            placeholder="۰" placeholderTextColor={colors.textFaint} keyboardType="number-pad"
            style={[styles.input, styles.amountInput]} textAlign="center" />

          {!isCheque ? <>
            <Text style={styles.label}>تعداد اقساط</Text>
            <TextInput accessibilityLabel="تعداد اقساط" value={countText}
              onChangeText={text => setCountText(toFaDigits(toEnDigits(text).replace(/[^\d]/g, '')))}
              placeholder="مثلاً ۱۲" placeholderTextColor={colors.textFaint} keyboardType="number-pad" style={styles.input} />
          </> : null}

          <Text style={styles.label}>{isCheque ? 'تاریخ سررسید چک' : 'اولین سررسید'}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isCheque ? 'انتخاب سررسید چک' : 'انتخاب اولین سررسید'}
            onPress={() => setDatePickerOpen(true)} style={styles.pickerRow}>
            <Text style={styles.pickerValue}>📅  {formatJalaliDate(firstDue.toISOString())}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="تنظیمات بیشتر"
            accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen(open => !open)} style={styles.moreRow}>
            <View style={styles.reminderText}>
              <Text style={styles.moreTitle}>تنظیمات بیشتر</Text>
              {!moreOpen ? <Text style={styles.note}>{isCheque ? 'گیرنده، شماره چک، بانک و یادآوری' : 'فروشگاه، پرداخت‌های قبلی و یادآوری'}</Text> : null}
            </View>
            <Text style={styles.chevron}>{moreOpen ? '▴' : '▾'}</Text>
          </TouchableOpacity>

          {moreOpen ? <>
            <Text style={styles.label}>{kind === 'purchase' ? 'فروشگاه (اختیاری)' : 'دریافت‌کننده (اختیاری)'}</Text>
            <TextInput accessibilityLabel="فروشگاه یا دریافت‌کننده" value={counterparty} onChangeText={setCounterparty}
              placeholder={kind === 'purchase' ? 'مثلاً دیجی‌کالا' : 'نام دریافت‌کننده'}
              maxLength={80} placeholderTextColor={colors.textFaint} style={styles.input} />

            {isCheque ? <>
              <Text style={styles.label}>شماره یا شناسه چک (اختیاری)</Text>
              <TextInput accessibilityLabel="شماره چک" value={chequeNumber}
                onChangeText={text => setChequeNumber(toEnDigits(text).replace(/[^\d]/g, ''))}
                maxLength={24} placeholder="شماره چک" placeholderTextColor={colors.textFaint} keyboardType="number-pad" style={styles.input} />
            </> : !editing ? <>
              <Text style={styles.label}>تعداد اقساط پرداخت‌شدهٔ قبلی</Text>
              <TextInput accessibilityLabel="تعداد اقساط پرداخت‌شدهٔ قبلی" value={paidCountText}
                onChangeText={text => setPaidCountText(toFaDigits(toEnDigits(text).replace(/[^\d]/g, '')))}
                placeholder="۰" placeholderTextColor={colors.textFaint} keyboardType="number-pad" style={styles.input} />
              <Text style={styles.note}>تاریخ بالا باید سررسید اولین قسطِ کل قرارداد باشد.</Text>
            </> : <Text style={styles.note}>وضعیت پرداخت‌ها را از فهرست سررسیدها تغییر بده.</Text>}

            {(kind === 'loan' || isCheque || (editing && !editing.kind && editing.bank)) ? <>
              <Text style={styles.label}>بانک (اختیاری)</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="انتخاب بانک" onPress={() => setBankPickerOpen(true)} style={styles.pickerRow}>
                {selectedBank ? <BankMark bank={selectedBank} size={28} /> : <View style={styles.bankPlaceholder} />}
                <Text style={styles.pickerValue} numberOfLines={1}>{selectedBank ? selectedBank.name : 'انتخاب نشده'}</Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
            </> : null}

            {!isCheque && lastDue ? <Text style={styles.note}>{`جمع اقساط: ${formatToman(amount * count)} · آخرین سررسید: ${formatJalaliDate(lastDue.toISOString())}`}</Text> : null}

            <View style={styles.reminderRow}>
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>یادآوری سررسید</Text>
                <Text style={styles.note}>یک روز قبل، حدود ساعت ۹ صبح؛ اگر آن زمان گذشته باشد، روز سررسید.</Text>
              </View>
              <Switch accessibilityLabel="یادآوری سررسید" value={reminderEnabled} disabled={reminderPermissionBusy}
                trackColor={{ false: colors.border, true: colors.primary }}
                onValueChange={async value => {
                  if (!value) { setReminderEnabled(false); return; }
                  setReminderPermissionBusy(true);
                  try {
                    if (await requestNotificationPermission() === 'granted') setReminderEnabled(true);
                    else Alert.alert('مجوز اعلان لازم است', 'اعلان‌های پول‌بین را در تنظیمات گوشی فعال کن. ثبت بدون یادآوری هم ممکن است.');
                  } catch { Alert.alert('یادآوری فعال نشد', 'دوباره تلاش کن.'); }
                  finally { setReminderPermissionBusy(false); }
                }} />
            </View>
            <Text style={styles.note}>{isCheque ? 'ثبت چک و علامت «پاس شد» فقط برای پیگیری است؛ تراکنش مالی جدیدی نمی‌سازد.' : 'علامت پرداخت فقط وضعیت قسط را تغییر می‌دهد؛ خرج جدیدی ثبت نمی‌شود.'}</Text>
          </> : null}
        </Card>

        {editing ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteLink}>
            <Text style={styles.deleteText}>{isCheque ? 'حذف این چک' : 'حذف این اقساط'}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>

      <FormFooter
        submitTitle={editing ? 'ذخیره‌ی تغییرات' : 'افزودن'}
        onSubmit={handleSave}
        disabled={error !== null || reminderPermissionBusy}
        error={count > MAX_COUNT || (count > 0 && !editing && initialPaidCount > count) ? error : null}
      />

      <JalaliDatePicker
        visible={datePickerOpen}
        value={firstDue}
        title={isCheque ? 'سررسید چک' : 'اولین سررسید'}
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
  kindRow: { flexDirection: 'row', gap: spacing.sm },
  kindOption: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, flexDirection: 'row', minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  kindSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  kindEmoji: { fontSize: 16 },
  kindLabel: { fontSize: 12, color: colors.textMuted },
  kindLabelSelected: { color: colors.primaryDark, fontWeight: '700' },
  note: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderText: { flex: 1, gap: spacing.xs },
  reminderTitle: { fontSize: 14, color: colors.text, fontWeight: '700' },
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
  amountInput: { height: 52, fontSize: 20, fontWeight: '800' },
  moreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 42 },
  moreTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
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
