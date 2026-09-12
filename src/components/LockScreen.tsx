import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLock } from '../state/LockContext';
import { colors, spacing } from '../theme';
import { toFaDigits } from '../utils/format';
import { PinPad } from './PinPad';
import { Text } from './Text';

const logo = require('../public/logos/logo_vertical.png');

/**
 * لایه‌ی قفل روی کل اپ.
 *
 * `Modal` نیست — یک View مطلق روی ناوبری. مودال در این پروژه دو بار دردسر
 * ساخته (کرش release و مرز لمس)، و اینجا هیچ دلیلی برایش نیست.
 *
 * اگر اثر انگشت روشن باشد، خودش با باز شدن صفحه پنجره‌اش را می‌آورد؛ کاربر
 * می‌تواند ببندد و رمز بزند.
 */
export function LockScreen() {
  const { locked, biometric, tryPin, tryBiometric, failedAttempts, cooldownUntil } = useLock();
  const [message, setMessage] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [now, setNow] = useState(Date.now());

  const waiting = cooldownUntil > now;

  // شمارنده‌ی «چند ثانیه صبر کن» — فقط وقتی لازم است تیک می‌زند.
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  const askBiometric = useCallback(async () => {
    try {
      await tryBiometric();
    } catch {
      setMessage('اثر انگشت جواب نداد؛ رمز را بزن.');
    }
  }, [tryBiometric]);

  // با هر بار قفل شدن، پیام قبلی («رمز درست نیست») نباید بماند.
  useEffect(() => {
    if (!locked) return;
    setMessage(null);
    setResetKey(key => key + 1);
    if (biometric) askBiometric();
  }, [locked, biometric, askBiometric]);

  if (!locked) return null;

  async function handlePin(pin: string) {
    const ok = await tryPin(pin);
    if (ok) return;
    setResetKey(key => key + 1);
    setMessage('رمز درست نیست.');
  }

  const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);

  return (
    <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>پول‌بین قفل است</Text>
        <Text style={styles.subtitle}>
          {waiting
            ? `${toFaDigits(failedAttempts)} بار اشتباه — ${toFaDigits(secondsLeft)} ثانیه صبر کن`
            : message ?? 'رمز چهاررقمی را وارد کن'}
        </Text>
      </View>

      <PinPad
        onComplete={handlePin}
        resetKey={resetKey}
        disabled={waiting}
        extraKey={biometric ? { label: '👆', onPress: askBiometric } : null}
      />

      <Text style={styles.hint}>
        اگر رمز را فراموش کرده‌ای، تنها راه، پاک کردن داده‌ی اپ از تنظیمات اندروید است — و
        بعد بازگردانی از فایل پشتیبان.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 150, height: 80 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', minHeight: 22 },
  hint: {
    fontSize: 11,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
