import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { DuplicateCard } from '../components/DuplicateCard';
import { FormFooter } from '../components/FormFooter';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionFormFields } from '../components/TransactionFormFields';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { RootStackParamList } from '../navigation/types';
import { DuplicateMatch, findDuplicate } from '../services/duplicates';
import { parseSmsRemote } from '../services/fakeApi';
import { useTransactions } from '../state/TransactionsContext';
import { colors, spacing } from '../theme';
import { ParsedSms } from '../types';
import { toFaDigits } from '../utils/format';
import { Text } from '../components/Text';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

export function ConfirmTransactionScreen({ route, navigation }: Props) {
  const { rawSms } = route.params;
  const { transactions, addTransaction } = useTransactions();
  const form = useTransactionForm();
  const { setValues } = form;

  const [parsed, setParsed] = useState<ParsedSms | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  /**
   * یک بار، درست بعد از پارس، و نه با هر ویرایش کاربر: اگر با هر تغییر مبلغ
   * دوباره حساب می‌شد، کارت وسط تایپ ظاهر و ناپدید می‌شد و کاربر را گیج می‌کرد.
   * «تراکنش جدید است» هم یک بار برای همیشه کارت را برمی‌دارد.
   */
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);

  useEffect(() => {
    let mounted = true;
    parseSmsRemote(rawSms).then(result => {
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
      setValues({
        amount: result.amount,
        merchant: result.merchant,
        categoryId: result.categoryId,
        type: result.type,
        bank: result.bank,
      });
    });
    return () => {
      mounted = false;
    };
    // فهرست تراکنش‌ها عمداً وابستگی نیست — فقط وضعیت لحظه‌ی رسیدن پیامک مهم است.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSms, setValues]);

  async function handleConfirm() {
    if (!parsed || !form.canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addTransaction({
        amount: form.amount,
        merchant: form.merchant.trim(),
        categoryId: form.categoryId,
        date: parsed.date,
        bank: form.bank ?? undefined,
        cardLast4: parsed.cardLast4 ?? undefined,
        accountLast4: parsed.accountLast4 ?? undefined,
        balance: parsed.balance ?? undefined,
        type: form.type,
        rawSms,
      });
      navigation.navigate('Dashboard');
    } catch {
      setSaveError('ثبت تراکنش ناموفق بود. دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
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
          title="این درست است؟"
          subtitle="هر چیزی را که لازم است اصلاح کن، بعد با یک لمس تایید کن."
        />

        {duplicate ? (
          <DuplicateCard
            match={duplicate}
            onSkip={() => navigation.goBack()}
            onDismiss={() => setDuplicate(null)}
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
      </ScrollView>

      <FormFooter
        submitTitle="تایید و ثبت"
        onSubmit={handleConfirm}
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
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  metaLine: { fontSize: 12, color: colors.textFaint, marginTop: spacing.sm },
  rawToggle: { alignItems: 'center', paddingVertical: spacing.sm },
  rawToggleText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  rawCard: { backgroundColor: colors.surfaceAlt },
  rawText: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
});
