import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/** تیتر و زیرتیتر مشترک بالای صفحه‌های فرم. */
export function FormScreenHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
});
