import { Transaction } from '../types';
import { toFaDigits } from '../utils/format';

/**
 * موجودی هر کارت/حساب از روی «مانده»ی پیامک‌های بانک.
 *
 * بانک بعد از هر تراکنش مانده را در پیامک می‌نویسد؛ پارسر آن را در
 * `Transaction.balance` نگه می‌دارد. اینجا فقط آخرین مانده‌ی هر حساب برداشته
 * می‌شود — هیچ محاسبه‌ای روی خرج و درآمد نیست، چون تراکنش‌های دستی و
 * پیامک‌هایی که نرسیده‌اند، جمع را غلط می‌کنند. عددِ بانک، حرف آخر است.
 */
export interface AccountBalance {
  /** کلید یکتا: بانک + کارت یا حساب. */
  key: string;
  bank: string | null;
  cardLast4: string | null;
  accountLast4: string | null;
  /** تومان */
  balance: number;
  /** ISO — زمان پیامکی که این مانده از آن آمده. */
  asOf: string;
}

/**
 * کارت و حساب عمداً یکی نمی‌شوند.
 *
 * یک کارت و حسابِ پشتش ممکن است دو پیامک با دو شکل بدهند («کارت ****۱۲۳۴» و
 * «حساب…۵۸۴۰»). بدون دانستن اینکه کدام کارت به کدام حساب وصل است — که از
 * پیامک درنمی‌آید — نمی‌شود ادغامشان کرد؛ بهتر است دو ردیف دیده شود تا یکی
 * دیگری را با مانده‌ی اشتباه بازنویسی کند.
 */
export function accountKey(tx: Pick<Transaction, 'bank' | 'cardLast4' | 'accountLast4'>): string {
  const bank = tx.bank ?? '?';
  if (tx.cardLast4) return `${bank}/card/${tx.cardLast4}`;
  if (tx.accountLast4) return `${bank}/account/${tx.accountLast4}`;
  return `${bank}/-`;
}

/** آخرین مانده‌ی هر حساب، تازه‌ترین اول. */
export function latestBalances(transactions: Transaction[]): AccountBalance[] {
  const byKey = new Map<string, AccountBalance>();

  for (const tx of transactions) {
    if (typeof tx.balance !== 'number' || !Number.isFinite(tx.balance)) continue;

    const key = accountKey(tx);
    const seen = byKey.get(key);
    if (seen && new Date(seen.asOf).getTime() >= new Date(tx.date).getTime()) continue;

    byKey.set(key, {
      key,
      bank: tx.bank ?? null,
      cardLast4: tx.cardLast4 ?? null,
      accountLast4: tx.accountLast4 ?? null,
      balance: tx.balance,
      asOf: tx.date,
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime(),
  );
}

/** «کارت ۱۲۳۴»، «حساب ۵۸۴۰» یا خالی وقتی هیچ‌کدام معلوم نیست. */
export function accountLabel(account: AccountBalance): string {
  if (account.cardLast4) return `کارت ${toFaDigits(account.cardLast4)}`;
  if (account.accountLast4) return `حساب ${toFaDigits(account.accountLast4)}`;
  return '';
}

export function totalBalance(accounts: AccountBalance[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}
