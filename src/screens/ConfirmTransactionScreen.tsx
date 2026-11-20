import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { DuplicateCard } from '../components/DuplicateCard';
import { TransferCard } from '../components/TransferCard';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionFormFields } from '../components/TransactionFormFields';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { DuplicateMatch, findDuplicate } from '../services/duplicates';
import { parseSmsRemote } from '../services/fakeApi';
import { buildSmsReport } from '../services/smsReport';
import { findTransferCounterpart } from '../services/transfers';
import { useTransactions } from '../state/TransactionsContext';
import { colors, spacing } from '../theme';
import { ParsedSms, Transaction } from '../types';
import { toFaDigits } from '../utils/format';
import { Text } from '../components/Text';
import { usePendingSms } from '../state/PendingSmsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

export function ConfirmTransactionScreen({ route, navigation }: Props) {
  const { rawSms, pendingSmsId, receivedAt } = route.params;
  const { dismiss: dismissPending, refresh: refreshPending } = usePendingSms();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const form = useTransactionForm();
  const { setValues } = form;

  const [parsed, setParsed] = useState<ParsedSms | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  /**
   * یک بار، درست بعد از پارس، و نه با هر ویرایش کاربر: اگر با هر تغییر مبلغ
   * دوباره حساب می‌شد، کارت وسط تایپ ظاهر و ناپدید می‌شد و کاربر را گیج می‌کرد.
   * «تراکنش جدید است» هم یک بار برای همیشه کارت را برمی‌دارد.
   */
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);

  /**
   * سرِ دیگرِ یک انتقال داخلی، اگر پیدا شد؛ مثل تکراری، یک بار لحظه‌ی پارس.
   * `transferDecision` جواب کاربر است: null یعنی هنوز نپرسیده‌ایم/جواب نداده.
   */
  const [counterpart, setCounterpart] = useState<Transaction | null>(null);
  const [transferDecision, setTransferDecision] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    parseSmsRemote(rawSms, receivedAt !== undefined ? new Date(receivedAt) : undefined).then(result => {
      if (!mounted) return;
      setParsed(result);
      setDuplicate(
        findDuplicate(
          {
            amount: result.amount ?? 0,
            type: result.type,
            date: result.date,
            bank: result.bank,
            rawSms,
          },
          transactions,
        ),
      );
      setCounterpart(
        result.amount
          ? findTransferCounterpart(
              {
                amount: result.amount,
                type: result.type,
                date: result.date,
                bank: result.bank,
                cardLast4: result.cardLast4,
                accountLast4: result.accountLast4,
              },
              transactions,
            )
          : null,
      );
      setTransferDecision(null);
      setValues({
        amount: result.amount,
        merchant: result.merchant,
        categoryId: result.categoryId,
        type: result.type,
        bank: result.bank,
        date: result.date,
      });
    });
    return () => {
      mounted = false;
    };
    // فهرست تراکنش‌ها عمداً وابستگی نیست — فقط وضعیت لحظه‌ی رسیدن پیامک مهم است.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSms, receivedAt, setValues]);

  async function handleConfirm() {
    if (!parsed || !form.canSave || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    let committed = false;
    try {
      if (pendingSmsId) {
        const waiting = await refreshPending();
        const alreadySaved = transactions.some(tx => tx.sourceSmsId === pendingSmsId);
        if (!waiting.some(item => item.id === pendingSmsId) && !alreadySaved) {
          setSaveError('این مورد قبلاً ثبت یا رد شده است. به فهرست انتظار برگرد.');
          return;
        }
      }
      await addTransaction({
        amount: form.amount,
        merchant: form.merchant.trim(),
        categoryId: form.categoryId,
        date: form.date.toISOString(),
        bank: form.bank ?? undefined,
        cardLast4: parsed.cardLast4 ?? undefined,
        accountLast4: parsed.accountLast4 ?? undefined,
        balance: parsed.balance ?? undefined,
        type: form.type,
        rawSms,
        sourceSmsId: pendingSmsId,
        internalTransfer: form.internalTransfer || undefined,
      });
      committed = true;
      // سرِ دیگر هم باید نشان بخورد، وگرنه نصف انتقال هنوز خرج شمرده می‌شود.
      if (form.internalTransfer && counterpart && !counterpart.internalTransfer) {
        updateTransaction(counterpart.id, { internalTransfer: true });
      }
      if (pendingSmsId) await dismissPending(pendingSmsId);
      // goBack نه navigate('Dashboard'): اگر پیامک دیگری هم در صف است، صفحه‌ی
      // تاییدش زیر همین است و باید دیده شود، نه اینکه تا داشبورد پرش کنیم.
      navigation.goBack();
    } catch {
      setSaveError(committed
        ? 'تراکنش ثبت شد؛ پاک‌کردن آن از فهرست انتظار ناموفق بود. دوباره تلاش کن.'
        : 'ثبت تراکنش ناموفق بود. دوباره تلاش کن.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function skipDuplicate() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (pendingSmsId) await dismissPending(pendingSmsId);
      navigation.goBack();
    } catch {
      setSaveError('کنار گذاشتن این مورد ناموفق بود. دوباره تلاش کن.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  /**
   * گزارش پیامکی که غلط خوانده شده — تنها راه رسیدن شکل پیامک بانک‌های دیگر
   * به ما، چون سرور نداریم. هیچ‌چیز خودکار نمی‌رود: کاربر می‌بیند چه چیزی در
   * متن هست، تایید می‌کند، و خودش مقصد را در منوی هم‌رسانی انتخاب می‌کند.
   */
  function handleReport() {
    if (!parsed) return;

    Alert.alert(
      'گزارش پیامک',
      'متن پیامک همراه با چیزی که پول‌بین از آن فهمیده، در منوی هم‌رسانی باز می‌شود تا برای ما بفرستی. شماره‌ی حساب و کارت پوشانده می‌شوند؛ مبلغ و مانده می‌مانند چون بدون آن‌ها نمی‌شود اشتباه را پیدا کرد.',
      [
        { text: 'بازگشت', style: 'cancel' },
        {
          text: 'ادامه',
          onPress: () => {
            Share.share({ message: buildSmsReport(rawSms, parsed) }).catch(() => {
              // کاربر منوی هم‌رسانی را بست؛ کاری لازم نیست.
            });
          },
        },
      ],
    );
  }

  if (!parsed) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>در حال خواندن پیامک…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          onBack={() => navigation.goBack()}
          title="این درست است؟"
          subtitle="هر چیزی را که لازم است اصلاح کن، بعد با یک لمس تایید کن."
        />

        {duplicate ? (
          <DuplicateCard
            match={duplicate}
            onSkip={skipDuplicate}
            onDismiss={() => setDuplicate(null)}
          />
        ) : null}

        {counterpart && !duplicate ? (
          <TransferCard
            counterpart={counterpart}
            type={form.type}
            decision={transferDecision}
            onDecide={value => {
              setTransferDecision(value);
              // کارت فقط یک میان‌بر است؛ مقدار واقعی همان چیزی است که در فرم نشسته
              // و کاربر می‌تواند با همان دکمه‌های بالای صفحه عوضش کند.
              form.setInternalTransfer(value);
              // پیامک واریز فروشگاه ندارد و بدون آن دکمه‌ی ثبت خاموش می‌ماند؛ برای
              // انتقال، اسم خودش معلوم است.
              if (value && form.merchant.trim().length === 0) form.setMerchant('انتقال بین حساب‌ها');
            }}
          />
        ) : null}

        <TransactionFormFields
          form={form}
          onManageCategories={() => navigation.navigate('Categories')}
          amountFooter={<ConfidenceBar confidence={parsed.confidence} />}
          meta={
            parsed.bank || parsed.cardLast4 ? (
              <Text style={styles.metaLine}>
                {parsed.bank ?? 'بانک نامشخص'}
                {parsed.cardLast4 ? ` · کارت ${toFaDigits(parsed.cardLast4)}` : ''}
              </Text>
            ) : null
          }
        />

        <TouchableOpacity onPress={() => setShowRaw(v => !v)} style={styles.rawToggle}>
          <Text style={styles.rawToggleText}>
            {showRaw ? 'بستن متن پیامک' : 'نمایش متن اصلی پیامک'}
          </Text>
        </TouchableOpacity>
        {showRaw ? (
          <Card style={styles.rawCard}>
            <Text style={styles.rawText}>{rawSms}</Text>
          </Card>
        ) : null}

        <TouchableOpacity onPress={handleReport} style={styles.reportLink}>
          <Text style={styles.reportText}>این پیامک درست خوانده نشد؟ برای ما بفرست</Text>
        </TouchableOpacity>
      </ScrollView>

      <FormFooter
        submitTitle="تایید و ثبت"
        onSubmit={handleConfirm}
        loading={saving}
        disabled={!form.canSave}
        error={saveError}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  metaLine: { fontSize: 12, color: colors.textFaint, marginTop: spacing.sm },
  rawToggle: { alignItems: 'center', paddingVertical: spacing.sm },
  rawToggleText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  rawCard: { backgroundColor: colors.surfaceAlt },
  rawText: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
  reportLink: { alignItems: 'center', paddingVertical: spacing.sm },
  reportText: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
