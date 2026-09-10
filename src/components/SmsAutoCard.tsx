import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import {
  hasSmsPermission,
  isSupported,
  requestSmsPermission,
} from '../services/smsPermission';
import { colors, radius, spacing } from '../theme';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { Text } from './Text';

/**
 * پیشنهاد روشن کردن خواندن خودکار پیامک.
 *
 * عمداً در صفحه‌ی معرفی اولیه نیست: قبل از اینکه کاربر ارزش اپ را ببیند،
 * درخواست مجوز پیامک بیشتر باعث رد شدن می‌شود تا پذیرفتن. اینجا در داشبورد
 * می‌ماند تا وقتی روشن شود، و بعدش خودش ناپدید می‌شود.
 */
export function SmsAutoCard() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    hasSmsPermission().then(setGranted);
  }, []);

  useEffect(() => {
    refresh();

    // اگر کاربر از تنظیمات اندروید مجوز را داد، با برگشتن به اپ باید کارت برود.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  async function handleEnable() {
    setBusy(true);
    try {
      const outcome = await requestSmsPermission();
      setBlocked(outcome === 'blocked');
      if (outcome === 'granted') setGranted(true);
    } finally {
      setBusy(false);
    }
  }

  // تا وقتی نتیجه‌ی چک نیامده چیزی نشان نمی‌دهیم تا کارت لحظه‌ای پرش نزند.
  if (!isSupported() || granted !== false) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📩</Text>
        <Text style={styles.title}>دیگر دستی هم‌رسانی نکن</Text>
      </View>

      <Text style={styles.body}>
        با اجازه‌ی خواندن پیامک، پول‌بین تراکنش‌ها را خودش می‌گیرد و فقط برای تایید خبرت
        می‌کند. پیامک‌ها روی همین گوشی خوانده می‌شوند و هیچ‌جا ذخیره یا فرستاده نمی‌شوند.
      </Text>

      {blocked ? (
        <>
          <Text style={styles.blocked}>
            مجوز را قبلاً رد کرده‌ای، پس اندروید دیگر نمی‌پرسد. باید از تنظیمات خود گوشی
            روشنش کنی.
          </Text>
          <AppButton
            title="باز کردن تنظیمات"
            onPress={() => Linking.openSettings()}
            variant="secondary"
          />
        </>
      ) : (
        <AppButton title="اجازه می‌دهم" onPress={handleEnable} loading={busy} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, backgroundColor: colors.primarySoft, borderColor: colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  body: { fontSize: 13, color: colors.text, lineHeight: 24, marginBottom: spacing.xs },
  blocked: {
    fontSize: 12,
    color: colors.expense,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
});
