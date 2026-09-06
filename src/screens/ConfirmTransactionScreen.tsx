import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { CATEGORY_LIST } from '../data/categories';
import { RootStackParamList } from '../navigation/types';
import { parseSmsRemote } from '../services/fakeApi';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { CategoryId, ParsedSms } from '../types';
import { formatToman, toEnDigits, toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

/** فقط رقم‌ها را نگه می‌دارد و به شکل فارسیِ گروه‌بندی‌شده برمی‌گرداند. */
function normalizeAmountInput(text: string): string {
  const digits = toEnDigits(text).replace(/[^\d]/g, '');
  return digits ? formatToman(Number(digits), false) : '';
}

export function ConfirmTransactionScreen({ route, navigation }: Props) {
  const { rawSms } = route.params;
  const { addTransaction } = useTransactions();

  const [parsed, setParsed] = useState<ParsedSms | null>(null);
  const [amountText, setAmountText] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('other');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let mounted = true;
    parseSmsRemote(rawSms).then(result => {
      if (!mounted) return;
      setParsed(result);
      setAmountText(result.amount ? formatToman(result.amount, false) : '');
      setMerchant(result.merchant ?? '');
      setCategoryId(result.categoryId);
    });
    return () => {
      mounted = false;
    };
  }, [rawSms]);

  const amount = Number(toEnDigits(amountText).replace(/[^\d]/g, '')) || 0;
  const canSave = amount > 0 && merchant.trim().length > 0;

  async function handleConfirm() {
    if (!parsed || !canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addTransaction({
        amount,
        merchant: merchant.trim(),
        categoryId,
        date: parsed.date,
        bank: parsed.bank ?? undefined,
        cardLast4: parsed.cardLast4 ?? undefined,
        type: parsed.type,
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
        <View style={styles.headerBox}>
          <Text style={styles.title}>این درست است؟</Text>
          <Text style={styles.subtitle}>
            هر چیزی را که لازم است اصلاح کن، بعد با یک لمس تایید کن.
          </Text>
        </View>

        <Card style={styles.amountCard}>
          <Text style={styles.fieldLabel}>مبلغ (تومان)</Text>
          <TextInput
            value={amountText}
            onChangeText={text => setAmountText(normalizeAmountInput(text))}
            keyboardType="number-pad"
            style={styles.amountInput}
            textAlign="center"
          />
          <Text style={styles.amountPreview}>{formatToman(amount)}</Text>

          <View style={styles.confidenceRow}>
            <View style={styles.confidenceTrack}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${parsed.confidence * 100}%`,
                    backgroundColor: parsed.confidence >= 0.8 ? colors.success : colors.warning,
                  },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              اطمینان پارسر: {toFaDigits(Math.round(parsed.confidence * 100))}٪
            </Text>
          </View>
        </Card>

        <Card style={styles.gap}>
          <Text style={styles.fieldLabel}>فروشگاه / پذیرنده</Text>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="مثلاً اسنپ‌فود"
            placeholderTextColor={colors.textFaint}
            style={styles.textInput}
          />

          <Text style={[styles.fieldLabel, styles.spacedLabel]}>دسته‌بندی</Text>
          <View style={styles.chips}>
            {CATEGORY_LIST.map(category => {
              const active = category.id === categoryId;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
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
          </View>

          {parsed.bank || parsed.cardLast4 ? (
            <Text style={styles.metaLine}>
              {parsed.bank ?? 'بانک نامشخص'}
              {parsed.cardLast4 ? ` · کارت ${toFaDigits(parsed.cardLast4)}` : ''}
            </Text>
          ) : null}
        </Card>

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

      <View style={styles.footer}>
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        <AppButton title="تایید و ثبت" onPress={handleConfirm} loading={saving} disabled={!canSave} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
          <Text style={styles.cancelText}>بی‌خیال</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  headerBox: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
  amountCard: { alignItems: 'stretch', gap: spacing.sm },
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
  confidenceRow: { gap: spacing.xs, marginTop: spacing.sm },
  confidenceTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', borderRadius: radius.pill },
  confidenceText: { fontSize: 11, color: colors.textFaint },
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
  metaLine: { fontSize: 12, color: colors.textFaint, marginTop: spacing.sm },
  rawToggle: { alignItems: 'center', paddingVertical: spacing.sm },
  rawToggleText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  rawCard: { backgroundColor: colors.surfaceAlt },
  rawText: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  saveError: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  cancelLink: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: 13 },
});
