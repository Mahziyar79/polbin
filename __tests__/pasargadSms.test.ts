import { parseSms } from '../src/services/smsParser';
import { toGregorian, toJalali } from '../src/utils/jalali';

// Account number is synthetic; segment lengths match the supplied sample.
const raw = `*بانک پاسارگاد*

یارانه نقدی مرحله 188

واریز به: 356.0000.12345678.1

مبلغ: 3,000,000 ریال

05/07/30_11:02

موجودی: 46,583,119 ریال`;
const receivedAt = toGregorian(1406, 1, 10);

test('یارانه پاسارگاد با سال دو رقمی و حساب نقطه‌دار', () => {
  const result = parseSms(raw, receivedAt);
  expect(result).toMatchObject({ bank: 'بانک پاسارگاد', type: 'credit', merchant: 'یارانه نقدی', categoryId: 'income_other', amount: 300_000, balance: 4_658_312, accountLast4: '6781' });
  const date = new Date(result.date);
  expect(toJalali(date)).toMatchObject({ jy: 1405, jm: 7, jd: 30 });
  expect([date.getHours(), date.getMinutes()]).toEqual([11, 2]);
});

test('ارقام فارسی و شماره مرحله، مبلغ را تغییر نمی‌دهند', () => {
  const persian = raw.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  expect(parseSms(persian, receivedAt)).toMatchObject({ amount: 300_000, type: 'credit', accountLast4: '6781' });
});

test('حساب نقطه‌دار با تاریخ نقطه‌دار اشتباه نمی‌شود', () => {
  const result = parseSms(raw.replace('05/07/30_11:02', '1405.07.30_11:02'), receivedAt);
  expect(result.accountLast4).toBe('6781');
  expect(toJalali(new Date(result.date))).toMatchObject({ jy: 1405, jm: 7, jd: 30 });
});

test('شماره حساب با برچسب حساب هم از تمام بخش‌ها خوانده می‌شود', () => {
  expect(parseSms(raw.replace('واریز به:', 'حساب:'), receivedAt).accountLast4).toBe('6781');
});
