import { resolveCategory } from '../data/categories';
import {
  Category,
  CategoryBreakdown,
  Transaction,
  TransactionType,
} from '../types';
import { jalaliMonthRange } from '../utils/jalali';

/**
 * ابتدای روزی که `daysAgo` روز قبل از امروز است.
 *
 * بازه‌ها بر پایه‌ی روز تقویمی‌اند نه ۲۴ ساعت غلتان، چون کاربر وقتی «امروز» را
 * می‌زند انتظار دارد خرج‌های از نیمه‌شب را ببیند، نه خرج دیشب ساعت ۱۱ را.
 */
function startOfDay(daysAgo: number): number {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** `days = 1` یعنی فقط امروز، `days = 7` یعنی امروز و شش روز قبلش. */
export function withinLastDays(transactions: Transaction[], days: number): Transaction[] {
  const threshold = startOfDay(days - 1);
  return transactions.filter(t => new Date(t.date).getTime() >= threshold);
}

/** تراکنش‌های یک ماه شمسی. `monthsBack = 0` ماه جاری. */
export function withinJalaliMonth(transactions: Transaction[], monthsBack = 0): Transaction[] {
  const { start, end } = jalaliMonthRange(new Date(), monthsBack);
  const from = start.getTime();
  const to = end.getTime();

  return transactions.filter(tx => {
    const time = new Date(tx.date).getTime();
    return time >= from && time < to;
  });
}

/** کلید روز تقویمی محلی — برای گروه‌بندی تراکنش‌ها بر اساس روز. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** تراکنش‌ها را بر اساس روزی که در آن رخ داده‌اند دسته می‌کند. */
export function groupByDay(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const key = dayKey(new Date(tx.date));
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }

  return groups;
}

export function totalSpend(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
}

/** جمع واریزها. */
export function totalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
}

/** درآمد منهای خرج؛ منفی یعنی بیشتر از درآمد خرج شده. */
export function balanceOf(transactions: Transaction[]): number {
  return totalIncome(transactions) - totalSpend(transactions);
}

/** تفکیک بر اساس دسته — پیش‌فرض روی خرج، ولی برای درآمد هم کار می‌کند. */
export function buildBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType = 'debit',
): CategoryBreakdown[] {
  const matching = transactions.filter(t => t.type === type);
  const total = matching.reduce((sum, t) => sum + t.amount, 0);

  const buckets = new Map<string, { total: number; count: number }>();
  for (const tx of matching) {
    const bucket = buckets.get(tx.categoryId) ?? { total: 0, count: 0 };
    bucket.total += tx.amount;
    bucket.count += 1;
    buckets.set(tx.categoryId, bucket);
  }

  return Array.from(buckets.entries())
    .map(([categoryId, bucket]) => ({
      category: resolveCategory(categories, categoryId, type),
      total: bucket.total,
      count: bucket.count,
      share: total > 0 ? (bucket.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

