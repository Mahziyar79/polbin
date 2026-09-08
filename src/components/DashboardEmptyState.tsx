import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';
import { AppButton } from './AppButton';
import { Text } from './Text';

const LOGO = require('../public/logos/logo_withoutText.png');

const STEPS = [
  'پیامک تراکنش را در پیام‌رسان گوشی باز کن',
  'گزینه‌ی «هم‌رسانی» را بزن و پول‌بین را انتخاب کن',
  'مبلغ و دسته خودکار خوانده می‌شوند — فقط تایید کن',
];

/**
 * اولین چیزی که کاربر تازه می‌بیند.
 *
 * صفحه‌ی خالیِ پر از صفر به کاربر نمی‌گوید قدم بعدی چیست؛ این صفحه
 * جای همان صفرها را می‌گیرد تا وقتی اولین تراکنش ثبت شود.
 */
interface Props {
  onAddManually: () => void;
  onRestore: () => void;
}

export function DashboardEmptyState({ onAddManually, onRestore }: Props) {
  return (
    <View style={styles.wrap}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>بیا اولین خرجت را ثبت کنیم</Text>
      <Text style={styles.subtitle}>
        پول‌بین از روی پیامک بانک، مبلغ و فروشگاه را خودش می‌خواند.
      </Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{toFaDigits(index + 1)}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>یا</Text>
        <View style={styles.dividerLine} />
      </View>

      <AppButton title="ثبت دستی تراکنش" onPress={onAddManually} variant="secondary" />

      {/* کاربری که گوشی عوض کرده دقیقا همین‌جا می‌رسد؛ اگر این لینک نباشد راهی
          به صفحه‌ی بازگردانی ندارد، چون نوار بالای داشبورد هنوز نیامده. */}
      <TouchableOpacity onPress={onRestore} style={styles.restore}>
        <Text style={styles.restoreText}>گوشی را عوض کرده‌ای؟ بازگردانی از فایل پشتیبان</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: spacing.xl, gap: spacing.md },
  logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 24 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textFaint },
  restore: { alignItems: 'center', paddingVertical: spacing.md },
  restoreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
