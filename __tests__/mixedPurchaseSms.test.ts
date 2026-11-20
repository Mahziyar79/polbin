import { parseSms } from '../src/services/smsParser';
import { toGregorian, toJalali } from '../src/utils/jalali';

// Authentication code and terminal identifier are synthetic.
const auth = `محرمانه

خرید

اسنپ

1,750,000

رمز:12345

1405/07/07-15:31:47

10.10000000.1`;
const settlement = `-1,750,000 

07/07_15:32

مانده: 16,639,664`;
const receivedAt = toGregorian(1406, 1, 10);

test('پیامک ترکیبی، ساعت برداشت نهایی را می‌گیرد نه زمان صدور رمز', () => {
  const result = parseSms(`${auth}\n\n${settlement}`, receivedAt);
  expect(result).toMatchObject({ amount: 175_000, type: 'debit', merchant: 'اسنپ', bank: null, balance: 1_663_966 });
  const date = new Date(result.date);
  expect(toJalali(date)).toMatchObject({ jy: 1405, jm: 7, jd: 7 });
  expect([date.getHours(), date.getMinutes()]).toEqual([15, 32]);
});

test('وقتی مبلغ رمز و برداشت فرق دارند، مبلغ برداشت نهایی مقدم است', () => {
  expect(parseSms(`${auth.replace('1,750,000', '2,000,000')}\n\n${settlement}`, receivedAt).amount).toBe(175_000);
});

test('پیامک رمز به‌تنهایی، مبلغ قابل ثبت به عنوان تراکنش نمی‌دهد', () => {
  expect(parseSms(auth, receivedAt).amount).toBeNull();
});

test('الگوی برداشت نهایی با ارقام فارسی هم درست خوانده می‌شود', () => {
  const raw = `${auth}\n\n${settlement}`.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  expect(parseSms(raw, receivedAt)).toMatchObject({ amount: 175_000, type: 'debit', balance: 1_663_966 });
});
