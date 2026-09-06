import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppButton } from './AppButton';

interface Props {
  submitTitle: string;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  cancelTitle?: string;
  onCancel?: () => void;
}

/** نوار پایینی مشترک فرم‌ها: پیام خطا، دکمه‌ی اصلی، لینک انصراف. */
export function FormFooter({
  submitTitle,
  onSubmit,
  loading,
  disabled,
  error,
  cancelTitle,
  onCancel,
}: Props) {
  return (
    <View style={styles.footer}>
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
