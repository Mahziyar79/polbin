export const colors = {
  bg: '#F7FAF9',
  surface: '#FFFFFF',
  /** پس‌زمینه‌ی فرورفته: ورودی‌ها، چیپ‌های غیرفعال، ریل نمودارها. */
  surfaceAlt: '#ECF2F0',
  text: '#12343B',
  textMuted: '#51696F',
  textFaint: '#8AA1A6',
  border: '#DEE8E5',

  primary: '#008F83',
  primaryDark: '#005A63',
  primarySoft: '#DFF1EE',

  /** واریز و پیام‌های مثبت. */
  success: '#16B86A',
  successSoft: '#E2F7EC',

  expense: '#C0554F',
  expenseSoft: '#F8EBEA',

  /** موجودی و تاکیدهای طلایی. */
  gold: '#FFC52E',

  danger: '#E5484D',
  dangerSoft: '#FDECEC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * وزیرمتن ۳۳.۰.۳ — فایل‌ها در `assets/fonts` و لینک‌شده به اندروید.
 *
 * فقط چهار وزن ارسال می‌شود چون هر فایل حدود ۱۲۰ کیلوبایت به APK اضافه می‌کند
 * و کد فقط از همین‌ها استفاده می‌کند.
 *
 * نسخه‌ی «Farsi-Digits» عمداً استفاده نشده: آن نسخه ارقام لاتین را با شکل
 * فارسی رندر می‌کند، ولی ما ارقام را صریح با `toFaDigits` تبدیل می‌کنیم و
 * دو لایه تبدیل روی هم فقط قابل پیش‌بینی بودن را از بین می‌برد.
 */
export const fonts = {
  regular: 'Vazirmatn-Regular',
  semiBold: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
  extraBold: 'Vazirmatn-ExtraBold',
} as const;

/**
 * انتخاب فایل فونت از روی `fontWeight`.
 *
 * روی اندروید `fontWeight` با فونت سفارشی نادیده گرفته می‌شود و باید نام
 * خانواده‌ی دقیق داده شود، وگرنه همه‌چیز با وزن Regular رندر می‌شود.
 */
export function fontFamilyForWeight(weight?: string | number | null): string {
  const numeric = Number(weight);

  if (weight === 'bold' || numeric >= 800) return fonts.extraBold;
  if (numeric >= 700) return fonts.bold;
  if (numeric >= 500) return fonts.semiBold;
  return fonts.regular;
}
