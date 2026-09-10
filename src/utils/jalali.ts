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

/** سرستون‌های جدول تقویم، از شنبه. */
export const JALALI_WEEK_HEADERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/** معکوس {@link toJalali} — همان الگوریتم، برعکس. */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  let year = jy + 1595;
  let days =
    -355668 +
    365 * year +
    Math.floor(year / 33) * 8 +
    Math.floor(((year % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    days -= 1;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const monthLengths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let gm = 0;
  while (gm < 12 && gd > monthLengths[gm]) {
    gd -= monthLengths[gm];
    gm += 1;
  }

  return new Date(gy, gm, gd);
}

/**
 * تعداد روزهای یک ماه شمسی.
 *
 * برای اسفند به‌جای فرمول کبیسه، رفت‌وبرگشت می‌زنیم: اگر روز سی‌ام اسفند
 * بعد از تبدیل به میلادی و برگشت باز هم سی‌ام اسفند بود، ماه ۳۰ روزه است.
 * این‌طور با همان الگوریتم تبدیل سازگار می‌ماند و فرمول جداگانه‌ای که ممکن است
 * با آن اختلاف داشته باشد وارد نمی‌کنیم.
 */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;

  const roundTrip = toJalali(toGregorian(jy, 12, 30));
  return roundTrip.jm === 12 && roundTrip.jd === 30 ? 30 : 29;
}

/** جایگاه روز در هفته‌ی شمسی: شنبه ۰ تا جمعه ۶. */
export function jalaliWeekdayIndex(date: Date): number {
  return (date.getDay() + 1) % 7;
}

export function weekdayLabel(date: Date): string {
  return JALALI_WEEKDAYS[date.getDay()];
}

/**
 * بازه‌ی یک ماه شمسی: از نیمه‌شب روز اول تا نیمه‌شب اول ماه بعد.
 *
 * `monthsBack = 0` ماه جاری، `1` ماه قبل. برخلاف «۳۰ روز گذشته» که پنجره‌ای
 * غلتان است، این با همان ماهی جور درمی‌آید که کاربر در ذهنش دارد و بودجه هم
 * روی همین حساب می‌شود.
 */
export function jalaliMonthRange(base: Date, monthsBack = 0): { start: Date; end: Date } {
  const { jy, jm } = toJalali(base);

  let year = jy;
  let month = jm - monthsBack;
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const start = toGregorian(year, month, 1);
  start.setHours(0, 0, 0, 0);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = toGregorian(nextYear, nextMonth, 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

/** چند روز تا آخر ماه شمسی مانده، شامل امروز. */
export function daysLeftInJalaliMonth(base = new Date()): number {
  const { jy, jm, jd } = toJalali(base);
  return jalaliMonthLength(jy, jm) - jd + 1;
}

/** «شهریور» — بدون سال، برای جایی که سال از متن معلوم است. */
export function jalaliMonthName(base: Date, monthsBack = 0): string {
  const { jm } = toJalali(base);

  let month = jm - monthsBack;
  while (month < 1) month += 12;

  return JALALI_MONTHS[month - 1];
}

/**
 * `months` ماه شمسی جلو بردن یک تاریخ.
 *
 * روز ثابت می‌ماند مگر در ماه مقصد وجود نداشته باشد؛ آن‌وقت به آخرین روز همان
 * ماه چسبانده می‌شود. بدون این، قسطِ سی‌ویکم مهر در آبانِ سی‌روزه به اول آذر
 * می‌پرید و سررسیدها یکی‌یکی جلو می‌افتادند.
 */
export function addJalaliMonths(base: Date, months: number): Date {
  const { jy, jm, jd } = toJalali(base);

  const zeroBased = jm - 1 + months;
  const year = jy + Math.floor(zeroBased / 12);
  const month = ((zeroBased % 12) + 12) % 12 + 1;

  const day = Math.min(jd, jalaliMonthLength(year, month));
  const result = toGregorian(year, month, day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** اختلاف روزهای تقویمی — منفی یعنی تاریخ گذشته است. */
export function daysUntil(target: Date, from = new Date()): number {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(target) - startOf(from)) / 86_400_000);
}
