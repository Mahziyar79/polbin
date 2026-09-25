import { Transaction, TransactionType } from '../types';
import { accountKey } from './balances';

/**
 * انتقال بین حساب‌های خودِ کاربر.
 *
 * کارت‌به‌کارت از کارت A به کارت B دو پیامک می‌سازد: برداشت از A و واریز به B.
 * اگر هر دو خرج و درآمد شمرده شوند، «مجموع خرج ماه» به اندازه‌ی هر جابه‌جایی
 * باد می‌کند — شکایت رایج از اپ‌های مشابه. این‌جا جفتش پیدا می‌شود و کاربر
 * تصمیم می‌گیرد؛ تراکنشِ نشان‌شده در هیچ جمعی نمی‌آید ولی در فهرست می‌ماند.
 */
export interface TransferCandidate {
  amount: number;
  type: TransactionType;
  /** ISO */
  date: string;
  bank?: string | null;
  cardLast4?: string | null;
  accountLast4?: string | null;
}

/**
 * فاصله‌ی مجاز بین دو پیامک. کارت‌به‌کارت آنی است ولی پیامک بانک مقصد گاهی
 * چند دقیقه دیر می‌رسد؛ پایا و ساتنا ساعت‌ها فاصله دارند و عمداً پوشش داده
 * نمی‌شوند — با بازه‌ی چند ساعته، خرید و حقوقِ هم‌مبلغ هم جفت می‌شدند.
 */
export const TRANSFER_WINDOW_MS = 60 * 60 * 1000;

/**
 * آیا این دو، دو سرِ یک انتقال‌اند؟
 *
 * نوع مخالف، مبلغ برابر، زمان نزدیک، و **حساب متفاوت**: برداشت و واریز روی یک
 * کارت انتقال نیست، برگشت وجه است.
 */
export function looksLikeTransferPair(a: TransferCandidate, b: TransferCandidate): boolean {
  if (a.type === b.type) return false;
  if (a.amount !== b.amount || a.amount <= 0) return false;

  const gap = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime());
  if (Number.isNaN(gap) || gap > TRANSFER_WINDOW_MS) return false;

  return accountKey(normalize(a)) !== accountKey(normalize(b));
}

function normalize(c: TransferCandidate): Pick<Transaction, 'bank' | 'cardLast4' | 'accountLast4'> {
  return {
    bank: c.bank ?? undefined,
    cardLast4: c.cardLast4 ?? undefined,
    accountLast4: c.accountLast4 ?? undefined,
  };
}

/**
 * سرِ دیگرِ انتقال برای تراکنشی که هنوز ثبت نشده — یا null.
 *
 * بین چند کاندید، نزدیک‌ترین در زمان. `excludeId` برای ویرایش است.
 */
export function findTransferCounterpart(
  candidate: TransferCandidate,
  transactions: Transaction[],
  excludeId?: string,
): Transaction | null {
  const when = new Date(candidate.date).getTime();

  return (
    transactions
      .filter(tx => tx.id !== excludeId)
      .filter(tx => looksLikeTransferPair(candidate, tx))
      .sort(
        (a, b) =>
          Math.abs(new Date(a.date).getTime() - when) - Math.abs(new Date(b.date).getTime() - when),
      )[0] ?? null
  );
}

/** تراکنش‌هایی که در جمع خرج و درآمد می‌آیند — انتقال داخلی نه. */
export function countable(transactions: Transaction[]): Transaction[] {
  return transactions.filter(tx => !tx.internalTransfer);
}
