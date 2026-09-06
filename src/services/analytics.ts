import { getCategory } from '../data/categories';
import { CategoryBreakdown, Insight, Transaction } from '../types';
import { formatTomanShort, toFaDigits } from '../utils/format';

const DAY = 86_400_000;

export function withinLastDays(transactions: Transaction[], days: number): Transaction[] {
  const threshold = Date.now() - days * DAY;
  return transactions.filter(t => new Date(t.date).getTime() >= threshold);
}

export function totalSpend(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function buildBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const debits = transactions.filter(t => t.type === 'debit');
  const total = totalSpend(debits);

  const buckets = new Map<string, { total: number; count: number }>();
  for (const tx of debits) {
    const bucket = buckets.get(tx.categoryId) ?? { total: 0, count: 0 };
    bucket.total += tx.amount;
    bucket.count += 1;
    buckets.set(tx.categoryId, bucket);
  }

  return Array.from(buckets.entries())
    .map(([categoryId, bucket]) => ({
      category: getCategory(categoryId as CategoryBreakdown['category']['id']),
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
export function buildInsights(transactions: Transaction[]): Insight[] {
  const insights: Insight[] = [];

  const thisWeek = withinLastDays(transactions, 7);
  const lastWeek = transactions.filter(t => {
    const ts = new Date(t.date).getTime();
    return ts < Date.now() - 7 * DAY && ts >= Date.now() - 14 * DAY;
  });

  const thisWeekTotal = totalSpend(thisWeek);
  const lastWeekTotal = totalSpend(lastWeek);
  const breakdown = buildBreakdown(thisWeek);
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
