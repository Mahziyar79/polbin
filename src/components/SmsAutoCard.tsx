import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, View } from 'react-native';
import {
  hasNotificationPermission,
  hasSmsPermission,
  isSupported,
  requestNotificationPermission,
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
  /** پیامک مجاز است ولی نوتیفیکیشن نه — حالتی که کاربر معمولاً متوجهش نمی‌شود. */
  const [notificationsOff, setNotificationsOff] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  /**
   * از اندروید ۱۵، مجوز پیامک برای اپ‌هایی که از فروشگاه نصب نشده‌اند «محدود»
   * است: دیالوگ سیستم به‌جای پرسیدن می‌گوید «دسترسی رد شد» و تنها راه، «Allow
   * restricted settings» در صفحه‌ی اپ است. با نصب از بازار این پیش نمی‌آید، ولی
   * تا آن موقع (و برای هر کسی که فایل APK را مستقیم نصب می‌کند) باید راهش را گفت.
   */
  const [deniedOnRestrictedAndroid, setDeniedOnRestrictedAndroid] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    hasSmsPermission().then(setGranted);
    hasNotificationPermission().then(ok => setNotificationsOff(!ok));
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
      setDeniedOnRestrictedAndroid(outcome !== 'granted' && Number(Platform.Version) >= 35);
      if (outcome === 'granted') setGranted(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnableNotifications() {
    setBusy(true);
    try {
      const outcome = await requestNotificationPermission();
      setNotificationsBlocked(outcome === 'blocked');
      if (outcome === 'granted') setNotificationsOff(false);
    } finally {
      setBusy(false);
    }
  }

  if (!isSupported()) return null;

  if (granted === true && notificationsOff) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🔕</Text>
          <Text style={styles.title}>نوتیفیکیشن خاموش است</Text>
        </View>
        <Text style={styles.body}>
          خواندن پیامک روشن است، ولی بدون نوتیفیکیشن فقط وقتی کار می‌کند که پول‌بین باز
          باشد. پیامکی که موقع بسته بودن اپ برسد، بی‌خبر رد می‌شود.
        </Text>
        {notificationsBlocked ? (
          <AppButton
            title="روشن کردن از تنظیمات"
            onPress={() => Linking.openSettings()}
            variant="secondary"
          />
        ) : (
          <AppButton title="روشن کردن نوتیفیکیشن" onPress={handleEnableNotifications} loading={busy} />
        )}
      </Card>
    );
  }

  // تا وقتی نتیجه‌ی چک نیامده چیزی نشان نمی‌دهیم تا کارت لحظه‌ای پرش نزند.
  if (granted !== false) return null;

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

      {deniedOnRestrictedAndroid ? (
        <>
          <View style={styles.blockedBox}>
            <Text style={styles.blockedText}>
              اگر گوشی گفت «دسترسی رد شد» یا «تنظیمات محدود»: این را اندروید برای اپ‌هایی که
              از فروشگاه نصب نشده‌اند می‌گوید، نه به‌خاطر پول‌بین. راه بازش:
            </Text>
            <Text style={styles.blockedText}>۱. دکمه‌ی زیر را بزن تا صفحه‌ی اپ باز شود.</Text>
            <Text style={styles.blockedText}>
              ۲. منوی سه‌نقطه‌ی بالا ← «Allow restricted settings» (تنظیمات محدود مجاز).
            </Text>
            <Text style={styles.blockedText}>۳. دسترسی‌ها ← پیامک ← مجاز.</Text>
            <Text style={styles.blockedText}>تا آن موقع، هم‌رسانی دستی پیامک مثل قبل کار می‌کند.</Text>
          </View>
          <AppButton
            title="باز کردن صفحه‌ی اپ در تنظیمات"
            onPress={() => Linking.openSettings()}
            variant="secondary"
          />
        </>
      ) : blocked ? (
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
  blockedBox: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  blockedText: { fontSize: 12, color: colors.text, lineHeight: 22 },
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
