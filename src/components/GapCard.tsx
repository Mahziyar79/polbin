import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BalanceGap } from '../services/gaps';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatToman, toFaDigits } from '../utils/format';
import { Card } from './Card';
import { Text } from './Text';

interface Props {
  /** تازه‌ترین اول؛ فقط اولی نشان داده می‌شود و بقیه شمرده می‌شوند. */
  gaps: BalanceGap[];
  /** کاربر می‌خواهد همین را به‌عنوان تراکنش ثبت کند. */
  onRecord: (gap: BalanceGap) => void;
  /** کاربر می‌داند چیست و نمی‌خواهد ثبتش کند. */
  onDismiss: (gap: BalanceGap) => void;
}

/** «کارت ۱۲۳۴ بانک ملت»، «حساب ۵۸۴۰ بلوبانک» یا فقط نام بانک. */
function accountPhrase(gap: BalanceGap): string {
  const bank = gap.bank ?? 'بانک';
  if (gap.cardLast4) return `کارت ${toFaDigits(gap.cardLast4)} ${bank}`;
  if (gap.accountLast4) return `حساب ${toFaDigits(gap.accountLast4)} ${bank}`;
  return bank;
}

/**
 * هشدار «پولی بی‌خبر جابه‌جا شده» روی داشبورد.
 *
 * یکی‌یکی نشان می‌دهد نه همه با هم: هر اختلاف یک تصمیم است و فهرست پنج‌تایی
 * فقط کاربر را از تصمیم گرفتن منصرف می‌کند. بعد از ثبت یا نادیده گرفتن، بعدی
 * خودش جایش را می‌گیرد.
 */
export function GapCard({ gaps, onRecord, onDismiss }: Props) {
  const gap = gaps[0];
  if (!gap) return null;

  const gone = gap.type === 'debit';
  const rest = gaps.length - 1;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>{gone ? 'پولی بی‌خبر رفته' : 'پولی بی‌خبر آمده'}</Text>
      </View>

      <Text style={styles.body}>
        {`بین پیامک ${formatRelativeDay(gap.from)} و ${formatRelativeDay(gap.to)}، مانده‌ی ${accountPhrase(gap)} ${formatToman(gap.amount)} ${gone ? 'کمتر' : 'بیشتر'} از چیزی است که از تراکنش‌های ثبت‌شده درمی‌آید.`}
      </Text>
      <Text style={styles.hint}>
        {gone
          ? 'معمولاً کارمزد، برداشت از اینترنت‌بانک یا قسط خودکار است — یا پیامکی که نرسیده.'
          : 'معمولاً سود سپرده یا واریزی است که پیامکش نرسیده.'}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onRecord(gap)} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>ثبتش کن</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDismiss(gap)} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>می‌دانم، نادیده بگیر</Text>
        </TouchableOpacity>
      </View>

      {rest > 0 ? <Text style={styles.more}>{`و ${toFaDigits(rest)} مورد دیگر بعد از این`}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, backgroundColor: '#FFF7E0', borderColor: colors.gold },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.text, lineHeight: 24 },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  primary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  primaryText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  secondary: { paddingVertical: spacing.sm },
  secondaryText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  more: { fontSize: 11, color: colors.textFaint, marginTop: spacing.xs },
});
