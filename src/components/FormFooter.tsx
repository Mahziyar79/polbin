import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { colors, spacing } from '../theme';
import { AppButton } from './AppButton';
import { Text } from './Text';

interface Props {
  submitTitle: string;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
}

/**
 * نوار پایینی مشترک فرم‌ها: پیام خطا و دکمه‌ی اصلی؛ بازگشت در هدر است.
 *
 * با باز شدن کیبورد به‌اندازه‌ی ارتفاعش بالا می‌آید. بدون این، کیبورد رویش
 * می‌افتاد و کاربر به‌جای دکمه روی کیبورد لمس می‌کرد — چون با edge-to-edge،
 * اندروید ۱۵ به بعد دیگر پنجره را خودش کوچک نمی‌کند.
 */
export function FormFooter({
  submitTitle,
  onSubmit,
  loading,
  disabled,
  error,
}: Props) {
  const keyboardHeight = useKeyboardHeight();

  return (
    <View style={[styles.footer, { marginBottom: keyboardHeight }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton title={submitTitle} onPress={onSubmit} loading={loading} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
});
