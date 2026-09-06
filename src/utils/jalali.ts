/**
 * تبدیل تاریخ میلادی به شمسی (الگوریتم JalaliJSCalendar).
 * برای بازه‌ی ۱۹۰۱ تا ۲۱۰۰ میلادی دقیق است که برای این اپ کافی‌ست.
 */

const GREGORIAN_DAYS_IN_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/** روزهای ماه به حروف، برای نمایش «پانزدهم شهریور ۱۴۰۵». */
export const JALALI_DAY_WORDS = [
  '',
  'یکم',
  'دوم',
  'سوم',
  'چهارم',
  'پنجم',
  'ششم',
  'هفتم',
  'هشتم',
  'نهم',
  'دهم',
  'یازدهم',
  'دوازدهم',
  'سیزدهم',
  'چهاردهم',
  'پانزدهم',
  'شانزدهم',
  'هفدهم',
  'هجدهم',
  'نوزدهم',
  'بیستم',
  'بیست‌ویکم',
  'بیست‌ودوم',
  'بیست‌وسوم',
  'بیست‌وچهارم',
  'بیست‌وپنجم',
  'بیست‌وششم',
  'بیست‌وهفتم',
  'بیست‌وهشتم',
  'بیست‌ونهم',
  'سی‌ام',
  'سی‌ویکم',
];

export const JALALI_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export function toJalali(date: Date): JalaliDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    GREGORIAN_DAYS_IN_MONTH[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? 1 + (days % 31) : 1 + ((days - 186) % 30);

  return { jy, jm, jd };
}

export function jalaliMonthLabel(date: Date): string {
  const { jm, jy } = toJalali(date);
  return `${JALALI_MONTHS[jm - 1]} ${jy}`;
}

/** «پانزدهم شهریور ۱۴۰۵» — سال با ارقام لاتین برمی‌گردد و در UI فارسی می‌شود. */
export function jalaliLongDate(date: Date): string {
  const { jd, jm, jy } = toJalali(date);
  return `${JALALI_DAY_WORDS[jd]} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

export function weekdayLabel(date: Date): string {
  return JALALI_WEEKDAYS[date.getDay()];
}
