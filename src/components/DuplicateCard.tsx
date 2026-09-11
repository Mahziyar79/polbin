import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { DuplicateMatch } from '../services/duplicates';
import { colors, radius, spacing } from '../theme';
import { Transaction } from '../types';
import { formatRelativeDay, formatTime, formatToman } from '../utils/format';
import { Card } from './Card';
import { Text } from './Text';

/** «۱٬۱۹۰٬۰۰۰ تومان، اسنپ‌فود، امروز ۱۲:۳۰» */
export function describeTransaction(tx: Transaction): string {
  return `${formatToman(tx.amount)}، ${tx.merchant}، ${formatRelativeDay(tx.date)} ${formatTime(tx.date)}`;
}

interface Props {
  match: DuplicateMatch;
  /** کاربر گفت همان است — ثبت نکن و برگرد. */
  onSkip: () => void;
  /** کاربر گفت تراکنش جدید است — کارت را بردار و فرم عادی بماند. */
  onDismiss: () => void;
}

/**
 * هشدار تراکنش تکراری، بالای فرم تایید.
 *
 * فقط هشدار می‌دهد؛ هیچ‌چیز خودکار حذف نمی‌شود و فرم زیرش کامل کار می‌کند.
 * لحن دو حالت عمداً فرق دارد: متن خام یکسان یعنی قطعاً همان پیامک است و
 * دکمه‌ی اصلی «ثبت نکن» است؛ تطبیق مبلغ و زمان فقط حدس است و باید نرم‌تر بگوید.
 */
export function DuplicateCard({ match, onSkip, onDismiss }: Props) {
  const certain = match.reason === 'same-sms';

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>
        {certain ? 'این پیامک را قبلاً ثبت کرده‌ای' : 'شبیه تراکنشی است که قبلاً ثبت شده'}
      </Text>
      <Text style={styles.body}>{describeTransaction(match.existing)}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onSkip} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>{certain ? 'باشه، ثبت نکن' : 'همان است، ثبت نکن'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>
            {certain ? 'نه، تراکنش جدید است' : 'تراکنش جدید است'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, backgroundColor: '#FFF7E0', borderColor: colors.gold },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
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
});
