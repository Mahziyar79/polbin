import { Transaction, TransactionType } from '../types';
import { accountKey } from './balances';

/**
 * کشف تراکنشی که پیامک نداشته، از روی مانده‌ی پیامک‌ها.
 *
 * بانک بعد از هر تراکنش مانده را می‌نویسد. اگر مانده‌ی پیامک قبلی منهای مبلغ
 * این پیامک با مانده‌ی جدید نخواند، وسطشان پولی جابه‌جا شده که پیامکی برایش
 * نرسیده: کارمزد، برداشت از اینترنت‌بانک، قسط خودکار، یا پیامکی که گم شده.
 *
 * فقط از داده‌ای که همین حالا داریم حساب می‌شود؛ هیچ‌چیز خودکار ثبت نمی‌شود.
 * کاربر یا ثبتش می‌کند یا می‌گوید «می‌دانم» — هر دو تصمیم، خودِ کاربر.
 */
export interface BalanceGap {
  /** یکتا برای همان جفت پیامک؛ برای «نادیده بگیر» ذخیره می‌شود. */
  id: string;
  /** همان کلید {@link accountKey}. */
  key: string;
  bank: string | null;
  cardLast4: string | null;
  accountLast4: string | null;
  /** تومان، همیشه مثبت. */
  amount: number;
  /** debit یعنی پول بی‌خبر رفته؛ credit یعنی بی‌خبر آمده. */
  type: TransactionType;
  /** پیامکی که مانده‌ی قبلی از آن است — ISO. */
  from: string;
  /** پیامکی که مانده‌ی جدید از آن است — ISO. */
  to: string;
}

/**
 * کمتر از این، اختلاف نیست، گِرد شدن است: مانده‌ی ریالی به تومان تقسیم و گرد
 * می‌شود و هر پیامک تا یک تومان خطا می‌آورد. صد تومان از هر کارمزد واقعی
 * کوچک‌تر است و از هر خطای گرد کردن بزرگ‌تر.
 */
export const MIN_GAP_TOMAN = 100;

/**
 * اختلاف قدیمی‌تر از این نشان داده نمی‌شود. کاربر یادش نیست دو ماه پیش چه
 * کارمزدی رفته، و کارتی که جوابش را نمی‌داند فقط نادیده گرفته می‌شود.
 */
export const MAX_GAP_AGE_DAYS = 60;

function signed(tx: Pick<Transaction, 'amount' | 'type'>): number {
  return tx.type === 'credit' ? tx.amount : -tx.amount;
}

function time(tx: Pick<Transaction, 'date'>): number {
  return new Date(tx.date).getTime();
}

function hasBalance(tx: Transaction): tx is Transaction & { balance: number } {
  return typeof tx.balance === 'number' && Number.isFinite(tx.balance);
}

/**
 * آیا این تراکنش می‌تواند بخشی از اختلاف را توضیح بدهد؟
 *
 * تراکنش دستی همان بانک (کارت ندارد، پس کلیدش «بانک/-» است) و پیامکی از همین
 * حساب که مانده‌اش خوانده نشده. پیامک کارتِ دیگرِ همان بانک نه: آن کارت زنجیره‌ی
 * خودش را دارد.
 */
function explains(tx: Transaction, bank: string | undefined, key: string): boolean {
  if (tx.bank !== bank) return false;
  if (hasBalance(tx) && accountKey(tx) === key) return false;
  const own = accountKey(tx);
  return own === key || (!tx.cardLast4 && !tx.accountLast4);
}

/**
 * همه‌ی اختلاف‌های مانده، تازه‌ترین اول.
 *
 * `dismissed` شناسه‌ی اختلاف‌هایی است که کاربر گفته «می‌دانم». تراکنشی که کاربر
 * برای بستن یک اختلاف ثبت می‌کند، خودش اختلاف را می‌بندد و به این فهرست
 * احتیاجی ندارد.
 */
export function findBalanceGaps(
  transactions: Transaction[],
  dismissed: ReadonlySet<string> = new Set(),
  now = new Date(),
): BalanceGap[] {
  const oldest = now.getTime() - MAX_GAP_AGE_DAYS * 86_400_000;
  const chains = new Map<string, Array<Transaction & { balance: number }>>();

  for (const tx of transactions) {
    if (!hasBalance(tx)) continue;
    const key = accountKey(tx);
    const chain = chains.get(key);
    if (chain) chain.push(tx);
    else chains.set(key, [tx]);
  }

  const gaps: BalanceGap[] = [];

  for (const [key, chain] of chains) {
    chain.sort((a, b) => time(a) - time(b) || a.id.localeCompare(b.id));

    for (let index = 1; index < chain.length; index++) {
      const prev = chain[index - 1];
      const next = chain[index];

      // یک پیامک که دو بار ثبت شده: مانده و مبلغ هر دو یکی است. اختلاف نیست،
      // تکرار است و کارت تکراری جای خودش را دارد.
      if (prev.balance === next.balance && prev.amount === next.amount && prev.type === next.type) {
        continue;
      }

      const from = time(prev);
      const to = time(next);
      if (to < oldest) continue;

      // چیزی که بین این دو پیامک ثبت شده و می‌تواند اختلاف را توضیح بدهد.
      const explained = transactions
        .filter(tx => tx.id !== prev.id && tx.id !== next.id)
        .filter(tx => {
          const at = time(tx);
          return at > from && at <= to;
        })
        .filter(tx => explains(tx, prev.bank, key))
        .reduce((sum, tx) => sum + signed(tx), 0);

      // مانده‌ی جدید باید مانده‌ی قبلی + همه‌ی جابه‌جایی‌های بین این دو باشد.
      const expected = prev.balance + signed(next) + explained;
      const diff = next.balance - expected;
      if (Math.abs(diff) < MIN_GAP_TOMAN) continue;

      const id = `${key}|${prev.id}|${next.id}`;
      if (dismissed.has(id)) continue;

      gaps.push({
        id,
        key,
        bank: prev.bank ?? null,
        cardLast4: prev.cardLast4 ?? null,
        accountLast4: prev.accountLast4 ?? null,
        amount: Math.round(Math.abs(diff)),
        // مانده کمتر از انتظار است یعنی پولی رفته که ثبت نشده.
        type: diff < 0 ? 'debit' : 'credit',
        from: prev.date,
        to: next.date,
      });
    }
  }

  return gaps.sort((a, b) => new Date(b.to).getTime() - new Date(a.to).getTime());
}
