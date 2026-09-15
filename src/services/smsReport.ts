import { APP_VERSION } from '../data/support';
import { ParsedSms } from '../types';
import { formatJalaliDate, formatTime, formatToman, toEnDigits, toFaDigits } from '../utils/format';

/**
 * گزارش «این پیامک درست خوانده نشد».
 *
 * پارسر regex است و فقط شکل‌هایی را می‌فهمد که دیده‌ایم. سرور نداریم که خودمان
 * بفهمیم کدام پیامک‌ها غلط خوانده می‌شوند؛ تنها راه این است که کاربر خودش
 * بفرستد. این متن با منوی هم‌رسانی اندروید به تلگرام/ایمیل ما می‌رود — هیچ‌چیز
 * خودکار فرستاده نمی‌شود.
 */

/**
 * شماره‌های بلند را می‌پوشاند، مبلغ‌ها را نه.
 *
 * شماره‌ی حساب و کارت و شبا رشته‌های ۹ رقم به بالا بدون جداکننده‌اند؛ مبلغ‌ها
 * تقریباً همیشه جداکننده‌ی هزارگان دارند، و اگر هم نداشته باشند به‌ندرت به ۹
 * رقم می‌رسند (۱۰ میلیون تومان). چهار رقم آخر می‌ماند تا کاربر بتواند بگوید
 * «همین حساب» بدون اینکه کل شماره برود.
 */
export function maskNumbers(text: string): string {
  return toEnDigits(text)
    // شبا: IR + ۲۴ رقم، گاهی با فاصله.
    .replace(/IR[\d ]{24,30}/gi, 'IR********')
    .replace(/\d{9,}/g, digits => '*'.repeat(digits.length - 4) + digits.slice(-4));
}

function describe(parsed: ParsedSms): string {
  const amount = parsed.amount === null ? 'پیدا نشد' : formatToman(parsed.amount);
  const balance = parsed.balance === null ? 'پیدا نشد' : formatToman(parsed.balance);
  const when = `${formatJalaliDate(parsed.date)} ${formatTime(parsed.date)}`;

  return [
    `مبلغ: ${amount}`,
    `نوع: ${parsed.type === 'credit' ? 'درآمد' : 'خرج'}`,
    `بانک: ${parsed.bank ?? 'نامشخص'}`,
    `کارت: ${parsed.cardLast4 ? toFaDigits(parsed.cardLast4) : '—'}`,
    `حساب: ${parsed.accountLast4 ? toFaDigits(parsed.accountLast4) : '—'}`,
    `فروشگاه: ${parsed.merchant ?? 'پیدا نشد'}`,
    `تاریخ: ${when}`,
    `مانده: ${balance}`,
    `اطمینان پارسر: ${toFaDigits(Math.round(parsed.confidence * 100))}٪`,
  ].join('\n');
}

/** متن کاملی که هم‌رسانی می‌شود. */
export function buildSmsReport(raw: string, parsed: ParsedSms): string {
  return [
    `گزارش پیامک برای پول‌بین — نسخه‌ی ${toFaDigits(APP_VERSION)}`,
    '',
    'پیامک (شماره‌های حساب و کارت پوشانده شده):',
    maskNumbers(raw).trim(),
    '',
    'پول‌بین این‌طور فهمید:',
    describe(parsed),
    '',
    'چه چیزی اشتباه است؟ اینجا بنویس:',
    '',
  ].join('\n');
}
