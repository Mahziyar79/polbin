import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';
import { Text } from './Text';

export const PIN_LENGTH = 4;

interface Props {
  /** با هر رقم صدا زده می‌شود؛ وقتی به ۴ رقم رسید، `onComplete`. */
  onComplete: (pin: string) => void | Promise<void>;
  /** با هر تغییر، پد خالی می‌شود — برای «رمز اشتباه بود، دوباره». */
  resetKey?: number;
  disabled?: boolean;
  /** دکمه‌ی پایین‌چپ — مثلاً اثر انگشت. */
  extraKey?: { label: string; onPress: () => void } | null;
}

/**
 * صفحه‌کلید رمز، بدون کیبورد سیستم.
 *
 * کیبورد اندروید برای رمز چهاررقمی هم کند است هم روی صفحه‌ی قفل جا نمی‌شود؛
 * ده دکمه‌ی بزرگ با یک دست بهتر می‌نشیند. رقم‌ها فارسی نشان داده می‌شوند
 * ولی رمز داخلی لاتین می‌ماند تا هش همیشه یکی باشد.
 */
export function PinPad({ onComplete, resetKey = 0, disabled, extraKey }: Props) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    setPin('');
  }, [resetKey]);

  function press(digit: string) {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      // یک فریم صبر می‌کنیم تا نقطه‌ی چهارم پر شده دیده شود، بعد بررسی.
      setTimeout(() => onComplete(next), 60);
    }
  }

  function backspace() {
    if (disabled) return;
    setPin(current => current.slice(0, -1));
  }

  // کل اپ راست‌به‌چپ است و اولین فرزندِ هر ردیف سمت راست می‌نشیند. صفحه‌کلید
  // عددی ولی همه‌جا — حتی روی گوشی فارسی — ۱ ۲ ۳ از چپ به راست است، پس
  // ردیف‌ها برعکس نوشته شده‌اند تا روی صفحه درست دیده شوند.
  const rows = [
    ['3', '2', '1'],
    ['6', '5', '4'],
    ['9', '8', '7'],
  ];

  return (
    <View style={styles.box}>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View key={index} style={[styles.dot, index < pin.length ? styles.dotOn : null]} />
        ))}
      </View>

      {rows.map(row => (
        <View key={row.join('')} style={styles.row}>
          {row.map(digit => (
            <Key key={digit} label={toFaDigits(digit)} onPress={() => press(digit)} disabled={disabled} />
          ))}
        </View>
      ))}

      {/* به همان دلیل: پاک کردن پایین‌راست، اثر انگشت پایین‌چپ. */}
      <View style={styles.row}>
        <Key label="⌫" onPress={backspace} disabled={disabled} subtle />
        <Key label={toFaDigits('0')} onPress={() => press('0')} disabled={disabled} />
        {extraKey ? (
          <Key label={extraKey.label} onPress={extraKey.onPress} disabled={disabled} subtle />
        ) : (
          <View style={styles.key} />
        )}
      </View>
    </View>
  );
}

function Key({
  label,
  onPress,
  disabled,
  subtle,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  subtle?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      style={[styles.key, subtle ? styles.keySubtle : styles.keyFilled, disabled ? styles.keyDisabled : null]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={[styles.keyText, subtle ? styles.keyTextSubtle : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const KEY = 64;

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  dotOn: { backgroundColor: colors.primary },
  row: { flexDirection: 'row', gap: spacing.lg },
  key: {
    width: KEY,
    height: KEY,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFilled: { backgroundColor: colors.surfaceAlt },
  keySubtle: { backgroundColor: 'transparent' },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 26, fontWeight: '700', color: colors.text },
  keyTextSubtle: { fontSize: 22, color: colors.primary },
});
