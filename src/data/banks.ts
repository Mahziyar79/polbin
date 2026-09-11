/**
 * بانک‌های ایرانی — برای انتخاب دستی و فیلتر تراکنش‌ها.
 *
 * `name` عمداً همان رشته‌ای است که پارسر پیامک برمی‌گرداند («بانک ملت»)، تا
 * تراکنشی که از پیامک آمده و تراکنشی که دستی ثبت شده یک مقدار داشته باشند و
 * فیلتر هر دو را با هم بیاورد.
 *
 * `color` تقریبِ رنگ برند است، نه کد رسمی. فقط برای این است که نشان هر بانک در
 * فهرست از بقیه قابل تشخیص باشد. با آمدن فایل لوگوی واقعی، همین رنگ پس‌زمینه‌ی
 * نشان می‌ماند و تصویر رویش می‌نشیند.
 */
export interface Bank {
  id: string;
  /** نام کامل — همان چیزی که در تراکنش ذخیره می‌شود. */
  name: string;
  /** نام کوتاه برای نشان، وقتی لوگو نیست. */
  short: string;
  color: string;
  /**
   * نام‌های دیگری که بانک در پیامک خودش را با آن معرفی می‌کند.
   * بلوبانک پیامکش را فقط با «بلو» شروع می‌کند، نه «بلوبانک».
   */
  aliases?: string[];
}

export const BANKS: Bank[] = [
  { id: 'melli', name: 'بانک ملی', short: 'ملی', color: '#1B7A3E' },
  { id: 'mellat', name: 'بانک ملت', short: 'ملت', color: '#D6236A' },
  { id: 'saderat', name: 'بانک صادرات', short: 'صادرات', color: '#1B4E9B' },
  { id: 'tejarat', name: 'بانک تجارت', short: 'تجارت', color: '#0E7BC1' },
  { id: 'sepah', name: 'بانک سپه', short: 'سپه', color: '#1F4E9C' },
  { id: 'saman', name: 'بانک سامان', short: 'سامان', color: '#0B6FB4' },
  { id: 'pasargad', name: 'بانک پاسارگاد', short: 'پاسارگاد', color: '#C8A24A' },
  { id: 'parsian', name: 'بانک پارسیان', short: 'پارسیان', color: '#B01E2E' },
  { id: 'refah', name: 'بانک رفاه', short: 'رفاه', color: '#0E7C7B' },
  { id: 'ayandeh', name: 'بانک آینده', short: 'آینده', color: '#2B2F6B' },
  { id: 'keshavarzi', name: 'بانک کشاورزی', short: 'کشاورزی', color: '#12874B' },
  { id: 'maskan', name: 'بانک مسکن', short: 'مسکن', color: '#154C8C' },
  { id: 'eghtesad', name: 'بانک اقتصاد نوین', short: 'اقتصاد نوین', color: '#5B2D82' },
  { id: 'shahr', name: 'بانک شهر', short: 'شهر', color: '#C0392B' },
  { id: 'sina', name: 'بانک سینا', short: 'سینا', color: '#1D6F42' },
  { id: 'karafarin', name: 'بانک کارآفرین', short: 'کارآفرین', color: '#0F5FA6' },
  { id: 'dey', name: 'بانک دی', short: 'دی', color: '#8E44AD' },
  { id: 'resalat', name: 'بانک رسالت', short: 'رسالت', color: '#166B5A' },
  { id: 'gardeshgari', name: 'بانک گردشگری', short: 'گردشگری', color: '#0E8A8A' },
  { id: 'iranzamin', name: 'بانک ایران زمین', short: 'ایران زمین', color: '#1A6EA8' },
  { id: 'khavarmianeh', name: 'بانک خاورمیانه', short: 'خاورمیانه', color: '#2C3E77' },
  { id: 'sarmayeh', name: 'بانک سرمایه', short: 'سرمایه', color: '#7D3C98' },
  { id: 'postbank', name: 'پست بانک', short: 'پست بانک', color: '#0B6E4F' },
  { id: 'blu', name: 'بلوبانک', short: 'بلو', color: '#1D6FF2', aliases: ['بلو'] },
];

/** فقط نام‌ها — پارسر پیامک با همین کار می‌کند. */
export const BANK_NAMES: string[] = BANKS.map(bank => bank.name);

/** هر واژه‌ای که باید به یک بانک برسد: نام بدون «بانک»، به‌علاوه‌ی نام‌های دیگرش. */
export const BANK_MENTIONS: Array<{ word: string; name: string }> = BANKS.flatMap(bank => [
  { word: bank.name.replace('بانک ', ''), name: bank.name },
  ...(bank.aliases ?? []).map(word => ({ word, name: bank.name })),
]);

/** پیدا کردن بانک از روی نامی که در تراکنش ذخیره شده. */
export function findBank(name?: string | null): Bank | null {
  if (!name) return null;
  return BANKS.find(bank => bank.name === name) ?? null;
}
