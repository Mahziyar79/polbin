import { toJalali, JALALI_MONTHS } from './jalali';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** ارقام لاتین را به فارسی تبدیل می‌کند. */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, d => FA_DIGITS[Number(d)]);
}

/** ارقام فارسی/عربی را به لاتین برمی‌گرداند (برای پارس کردن پیامک). */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function groupDigits(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** مبلغ را به شکل «۱٬۲۵۰٬۰۰۰ تومان» برمی‌گرداند. */
export function formatToman(value: number, withUnit = true): string {
  const formatted = toFaDigits(groupDigits(value)).replace(/,/g, '٬');
  return withUnit ? `${formatted} تومان` : formatted;
}

/** مبالغ بزرگ را خلاصه می‌کند: «۱٫۲ میلیون تومان». */
export function formatTomanShort(value: number): string {
  if (value >= 1_000_000) {
    const millions = (value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1);
    return `${toFaDigits(millions.replace('.', '٫'))} میلیون تومان`;
  }
  if (value >= 1_000) {
    return `${toFaDigits(Math.round(value / 1000))} هزار تومان`;
  }
  return formatToman(value);
}

export function formatPercent(value: number): string {
  return `${toFaDigits(Math.round(value))}٪`;
}

export function formatJalaliDate(iso: string): string {
  const date = new Date(iso);
  const { jy, jm, jd } = toJalali(date);
  return `${toFaDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toFaDigits(jy)}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return toFaDigits(`${hh}:${mm}`);
}

/** «امروز»، «دیروز» یا تاریخ کامل شمسی. */
export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86_400_000);

  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 7) return `${toFaDigits(diffDays)} روز پیش`;
  return formatJalaliDate(iso);
}
