import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
  cancelTitle?: string;
  onCancel?: () => void;
}

/**
 * نوار پایینی مشترک فرم‌ها: پیام خطا، دکمه‌ی اصلی، لینک انصراف.
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
  cancelTitle,
  onCancel,
}: Props) {
  const keyboardHeight = useKeyboardHeight();

  return (
    <View style={[styles.footer, { marginBottom: keyboardHeight }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton title={submitTitle} onPress={onSubmit} loading={loading} disabled={disabled} />
      {onCancel ? (
        <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
          <Text style={styles.cancelText}>{cancelTitle ?? 'بی‌خیال'}</Text>
        </TouchableOpacity>
      ) : null}
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
  cancelLink: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: 13 },
});
