import { Transaction } from '../types';

/** تاریخِ «n روز پیش، ساعت hh:mm» به صورت ISO. */
function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let seq = 0;
const id = () => `tx_seed_${++seq}`;

/** تراکنش‌های نمونه‌ی ماه جاری — جای این‌ها بعداً پاسخ API می‌نشیند. */
export const FAKE_TRANSACTIONS: Transaction[] = [
  { id: id(), amount: 185_000, merchant: 'اسنپ‌فود', categoryId: 'food', date: daysAgo(0, 21, 12), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 62_000, merchant: 'اسنپ', categoryId: 'transport', date: daysAgo(0, 8, 40), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 940_000, merchant: 'هایپراستار', categoryId: 'grocery', date: daysAgo(1, 19, 5), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 128_000, merchant: 'کافه لمیز', categoryId: 'food', date: daysAgo(1, 17, 30), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 320_000, merchant: 'داروخانه دکتر رضایی', categoryId: 'health', date: daysAgo(2, 11, 15), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 75_000, merchant: 'تپسی', categoryId: 'transport', date: daysAgo(2, 9, 5), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 1_450_000, merchant: 'دیجی‌کالا', categoryId: 'shopping', date: daysAgo(3, 14, 22), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 210_000, merchant: 'قبض برق', categoryId: 'bills', date: daysAgo(4, 10, 0), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 99_000, merchant: 'فیلیمو', categoryId: 'entertainment', date: daysAgo(4, 22, 48), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 540_000, merchant: 'رفاه', categoryId: 'grocery', date: daysAgo(5, 18, 10), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 240_000, merchant: 'اسنپ‌فود', categoryId: 'food', date: daysAgo(5, 13, 25), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 150_000, merchant: 'شارژ ایرانسل', categoryId: 'bills', date: daysAgo(6, 20, 2), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 96_000, merchant: 'اسنپ', categoryId: 'transport', date: daysAgo(7, 8, 55), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 380_000, merchant: 'چیلیویری', categoryId: 'food', date: daysAgo(8, 21, 40), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 2_100_000, merchant: 'انتقال به علی محمدی', categoryId: 'transfer', date: daysAgo(9, 12, 0), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 680_000, merchant: 'جانبو', categoryId: 'grocery', date: daysAgo(11, 19, 30), bank: 'بانک سامان', cardLast4: '7788', type: 'debit' },
  { id: id(), amount: 145_000, merchant: 'کافه لمیز', categoryId: 'food', date: daysAgo(12, 16, 10), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
  { id: id(), amount: 430_000, merchant: 'زارا', categoryId: 'shopping', date: daysAgo(14, 15, 45), bank: 'بانک ملت', cardLast4: '3421', type: 'debit' },
];
