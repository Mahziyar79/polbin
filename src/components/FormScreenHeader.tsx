import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

interface Props {
  title: string;
  subtitle: string;
  /**
   * دکمه‌ی بازگشت در هدر. صفحه‌هایی که فقط «نمایش» هستند (تراکنش‌ها، تقویم،
   * درباره…) با این، دکمه‌ی بزرگ «بستن» پایین را لازم ندارند و خلوت‌تر می‌شوند.
   * فرم‌ها این را نمی‌گیرند؛ آن‌ها دکمه‌ی ثبت و لینک «بازگشت» خودشان را دارند.
   */
  onBack?: () => void;
}

/** تیتر و زیرتیتر مشترک بالای صفحه‌ها، با دکمه‌ی بازگشت اختیاری. */
export function FormScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {/* دکمه سمت چپ، جای همان دکمه‌ی منو در داشبورد، تا انگشت همیشه یک جا برود. */}
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="بازگشت">
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  // اندازه‌ی ثابت، مثل دکمه‌ی منو در داشبورد، تا مربع بماند نه بیضی.
  back: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.text, lineHeight: 24 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
});
