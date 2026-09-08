import { resolveCategory } from '../data/categories';
import {
  Category,
  CategoryBreakdown,
  Insight,
  Transaction,
  TransactionType,
} from '../types';
import { formatTomanShort, toFaDigits } from '../utils/format';

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

/**
 * تولید بینش/توصیه‌ی کوتاه از روی تراکنش‌ها.
 * قاعده‌محور است تا هیچ وابستگی به سرویس بیرونی نداشته باشد.
 */
export function buildInsights(transactions: Transaction[], categories: Category[]): Insight[] {
  const insights: Insight[] = [];

  const thisWeek = withinLastDays(transactions, 7);
  const lastWeek = transactions.filter(t => {
    const ts = new Date(t.date).getTime();
    return ts < startOfDay(6) && ts >= startOfDay(13);
  });

  const thisWeekTotal = totalSpend(thisWeek);
  const lastWeekTotal = totalSpend(lastWeek);
  const breakdown = buildBreakdown(thisWeek, categories);
  const top = breakdown[0];

  if (top && top.share >= 30) {
    insights.push({
      id: 'top-category',
      tone: top.share >= 45 ? 'warning' : 'neutral',
      title: `${toFaDigits(Math.round(top.share))}٪ خرج هفته‌ات «${top.category.label}» بوده`,
      body: `${formatTomanShort(top.total)} در ${toFaDigits(top.count)} تراکنش.`,
      action: `سقف هفتگی ${formatTomanShort(top.total * 0.8)} برای این دسته بگذار تا هفته‌ای ${formatTomanShort(top.total * 0.2)} کمتر خرج کنی.`,
    });
  }

  if (lastWeekTotal > 0) {
    const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
    if (Math.abs(change) >= 10) {
      const up = change > 0;
      insights.push({
        id: 'week-over-week',
        tone: up ? 'warning' : 'positive',
        title: up
          ? `${toFaDigits(Math.round(change))}٪ بیشتر از هفته‌ی قبل خرج کردی`
          : `${toFaDigits(Math.round(Math.abs(change)))}٪ کمتر از هفته‌ی قبل خرج کردی`,
        body: `این هفته ${formatTomanShort(thisWeekTotal)} در برابر ${formatTomanShort(lastWeekTotal)}.`,
        action: up
          ? 'قبل از هر خرید بالای ۵۰۰ هزار تومان، ۲۴ ساعت صبر کن.'
          : 'همین روند را نگه دار؛ مابه‌التفاوت را به پس‌انداز منتقل کن.',
      });
    }
  }

  const smallFood = thisWeek.filter(t => t.categoryId === 'food' && t.amount <= 250_000);
  if (smallFood.length >= 3) {
    const sum = smallFood.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'small-food',
      tone: 'neutral',
      title: `${toFaDigits(smallFood.length)} سفارش کوچک غذا در این هفته`,
      body: `مجموعاً ${formatTomanShort(sum)} — هرکدام کم، ولی روی هم قابل توجه.`,
      action: 'دو تا از این سفارش‌ها را به آشپزی خانگی تبدیل کن.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'empty',
      tone: 'positive',
      title: 'خرجت این هفته متعادل بوده',
      body: 'هیچ دسته‌ای از حد معمول بیرون نزده است.',
      action: 'چند پیامک دیگر ثبت کن تا تحلیل دقیق‌تری بگیری.',
    });
  }

  return insights;
}
