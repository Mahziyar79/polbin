import { Transaction, TransactionType } from '../types';
import { normalizeSmsText } from './smsParser';

/**
 * تشخیص تراکنش تکراری — یک خرید واقعی نباید دو بار ثبت شود.
 *
 * مسیرهایی که به تکرار می‌رسند واقعی و روزمره‌اند: پیامک هم نوتیف می‌شود هم
 * دستی هم‌رسانی می‌شود؛ بانک و درگاه هر دو برای یک خرید پیامک می‌فرستند؛ کاربر
 * خرجی را دستی ثبت می‌کند و بعد پیامکش می‌رسد. نتیجه‌ی همه یکی است: عدد
 * «مجموع خرج» غلط می‌شود و اعتماد به اپ می‌رود.
 *
 * اینجا فقط **تشخیص** است، تصمیم با کاربر است. دو قهوه‌ی پنجاه‌هزاری با دو دقیقه
 * فاصله کاملاً واقعی است؛ حذف خودکار بدتر از خودِ تکرار است.
 */

/** چرا این دو یکی حساب شده‌اند — رابط کاربری پیام متفاوتی برای هرکدام می‌دهد. */
export type DuplicateReason = 'same-sms' | 'same-amount-time';

export interface DuplicateMatch {
  existing: Transaction;
  reason: DuplicateReason;
}

/** چیزی که هنوز ثبت نشده و می‌خواهیم قبل از ثبت بسنجیم. */
export interface DuplicateCandidate {
  amount: number;
  type: TransactionType;
  /** ISO */
  date: string;
  bank?: string | null;
  rawSms?: string | null;
}

/**
 * وقتی هر دو طرف از پیامک آمده‌اند، زمانِ هر دو دقیق است و بازه باید تنگ باشد.
 * ده دقیقه فاصله‌ی معمول بین پیامک بانک و پیامک درگاه را می‌پوشاند.
 */
const SMS_WINDOW_MS = 10 * 60 * 1000;

/**
 * پیامکی که متنش یکی است.
 *
 * بعد از نرمال‌سازیِ پارسر، فاصله‌ها هم کلاً برداشته می‌شوند: دو پیامک متفاوت که
 * فقط در فاصله‌گذاری فرق کنند وجود ندارد، ولی یک پیامک که از دو مسیر (نوتیف و
 * هم‌رسانی) رسیده ممکن است در فاصله و خط جدید فرق کند.
 */
function sameSms(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const key = (text: string) => normalizeSmsText(text).replace(/\s+/g, '');
  return key(a) === key(b);
}

/** روز محلی — تراکنش دستی زمان دقیق ندارد و فقط می‌شود روزش را مقایسه کرد. */
function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * آیا زمانِ دو تراکنش «به‌اندازه‌ی کافی نزدیک» است؟
 *
 * ثبت دستی زمانش لحظه‌ی ثبت است نه لحظه‌ی خرید — کاربر شب می‌نشیند و خرج ظهر
 * را وارد می‌کند. پس اگر هر کدام از دو طرف پیامک نداشته باشد، بازه‌ی «همان
 * روز» درست است. اگر هر دو پیامک دارند، زمان هر دو دقیق است و بازه تنگ می‌شود.
 */
function closeInTime(candidate: DuplicateCandidate, existing: Transaction): boolean {
  const a = new Date(candidate.date);
  const b = new Date(existing.date);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  const bothFromSms = Boolean(candidate.rawSms) && Boolean(existing.rawSms);
  if (bothFromSms) return Math.abs(a.getTime() - b.getTime()) <= SMS_WINDOW_MS;
  return sameLocalDay(a, b);
}

/** بانک فقط وقتی جدا می‌کند که هر دو طرف معلوم باشند و فرق کنند. */
function conflictingBank(candidate: DuplicateCandidate, existing: Transaction): boolean {
  return Boolean(candidate.bank) && Boolean(existing.bank) && candidate.bank !== existing.bank;
}

function sameAmountAndTime(candidate: DuplicateCandidate, existing: Transaction): boolean {
  if (candidate.type !== existing.type) return false;
  if (candidate.amount !== existing.amount) return false;
  if (conflictingBank(candidate, existing)) return false;
  return closeInTime(candidate, existing);
}

/**
 * نزدیک‌ترین تراکنشِ ثبت‌شده که احتمالاً همین است، یا null.
 *
 * متن خام یکسان قوی‌ترین نشانه است و حتی اگر کاربر مبلغ را قبل از ثبت دستی
 * عوض کرده باشد همان پیامک است. بعد از آن، مبلغ و زمان و نوع؛ بین چند کاندید،
 * نزدیک‌ترین در زمان برمی‌گردد.
 *
 * `excludeId` برای ویرایش است: تراکنش نباید با خودش تکراری حساب شود.
 */
export function findDuplicate(
  candidate: DuplicateCandidate,
  transactions: Transaction[],
  excludeId?: string,
): DuplicateMatch | null {
  const others = excludeId ? transactions.filter(tx => tx.id !== excludeId) : transactions;

  const byRaw = others.find(tx => sameSms(candidate.rawSms, tx.rawSms));
  if (byRaw) return { existing: byRaw, reason: 'same-sms' };

  const when = new Date(candidate.date).getTime();
  const byAmount = others
    .filter(tx => sameAmountAndTime(candidate, tx))
    .sort(
      (a, b) =>
        Math.abs(new Date(a.date).getTime() - when) - Math.abs(new Date(b.date).getTime() - when),
    )[0];

  return byAmount ? { existing: byAmount, reason: 'same-amount-time' } : null;
}
