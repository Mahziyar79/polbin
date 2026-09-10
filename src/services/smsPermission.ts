import { PermissionsAndroid, Platform } from 'react-native';

/**
 * مجوز خواندن خودکار پیامک.
 *
 * `PermissionsAndroid` خود ری‌اکت‌نیتیو کافی است و ماژول نیتیو تازه‌ای لازم
 * ندارد؛ خودِ گرفتن پیامک در `SmsReceiver.kt` انجام می‌شود.
 */

const RECEIVE_SMS = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;

/** نوتیفیکیشن از اندروید ۱۳ به بعد مجوز جدا می‌خواهد. */
const NEEDS_NOTIFICATION_PERMISSION = Platform.OS === 'android' && Number(Platform.Version) >= 33;

export function isSupported(): boolean {
  return Platform.OS === 'android';
}

export async function hasSmsPermission(): Promise<boolean> {
  if (!isSupported()) return false;
  return PermissionsAndroid.check(RECEIVE_SMS);
}

export type PermissionOutcome = 'granted' | 'denied' | 'blocked';

/**
 * درخواست مجوز از کاربر.
 *
 * `blocked` یعنی کاربر گزینه‌ی «دیگر نپرس» را زده و دیالوگ سیستم دیگر بالا
 * نمی‌آید — تنها راه، تنظیمات خود اندروید است. این را باید به کاربر گفت،
 * وگرنه دکمه‌ای می‌بیند که هر بار می‌زند و هیچ اتفاقی نمی‌افتد.
 */
export async function requestSmsPermission(): Promise<PermissionOutcome> {
  if (!isSupported()) return 'denied';

  const result = await PermissionsAndroid.request(RECEIVE_SMS, {
    title: 'خواندن پیامک بانکی',
    message:
      'پول‌بین پیامک‌های تراکنش را خودش می‌خواند تا لازم نباشد هر بار دستی هم‌رسانی کنی. پیامک‌ها از گوشی خارج نمی‌شوند.',
    buttonPositive: 'اجازه می‌دهم',
    buttonNegative: 'نه',
  });

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
  }

  // بدون مجوز نوتیفیکیشن، پیامکی که موقع بسته بودن اپ می‌رسد بی‌صدا رد می‌شود.
  if (NEEDS_NOTIFICATION_PERMISSION) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  return 'granted';
}
