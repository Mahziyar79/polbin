import { parseSms } from '../src/services/smsParser';
import { toGregorian, toJalali } from '../src/utils/jalali';
import { ParsedSms } from '../src/types';
import { BANK_NAMES } from '../src/data/banks';

const receipt = toGregorian(1405, 8, 29);
receipt.setHours(12);
const cases: { name: string; raw: string; expected: Partial<ParsedSms> }[] = [
  { name: 'برداشت قسط سپه', raw: 'بانک سپه\nبرداشت:77,419,000\nحساب:3000000009012\nمانده:17,602,250\n8/29-7:01\nدريافت اتوماتيک قسط مورخ', expected: { amount: 7_741_900, balance: 1_760_225, type: 'debit', bank: 'بانک سپه' } },
  { name: 'برداشت با مبلغ در خط جدا', raw: 'بانک سپه\nبرداشت\nمبلغ:77,419,000\nحساب:3000000009012\nمانده:17,602,250\nدریافت خودکار قسط', expected: { amount: 7_741_900, type: 'debit' } },
  { name: 'یارانه پاسارگاد', raw: 'بانک پاسارگاد\nیارانه نقدی مرحله 188\nواریز به:356.0000.12345678.1\nمبلغ:3,000,000 ریال\n05/07/30_11:02\nموجودی:46,583,119 ریال', expected: { amount: 300_000, balance: 4_658_312, accountLast4: '6781', type: 'credit' } },
  { name: 'مبلغ کوچک تومان', raw: 'بانک ملت\nبرداشت:99 تومان\nمانده:10,000 تومان', expected: { amount: 99, balance: 10_000, type: 'debit' } },
  { name: 'مبلغ کوچک ریال', raw: 'بانک ملت\nبرداشت:999 ریال\nمانده:10,000 ریال', expected: { amount: 100, balance: 1000 } },
  { name: 'تومان با جداکننده', raw: 'بانک سامان\nخرید:1,250 تومان\nمانده:40,000 تومان', expected: { amount: 1250, balance: 40_000 } },
  { name: 'مانده پیش از مبلغ', raw: 'بانک ملی\nمانده:80,000,000 ریال\nحساب:3000000009012\nبرداشت:1,000,000 ریال', expected: { amount: 100_000, balance: 8_000_000 } },
  { name: 'هشدار نگهداری رمز کنار تراکنش واقعی', raw: 'بانک ملت\nبرداشت:1,000,000 ریال\nمانده:4,000,000 ریال\nرمز دوم خود را در اختیار دیگران نگذارید.', expected: { amount: 100_000, type: 'debit' } },
  { name: 'شناسه پیش از مبلغ', raw: 'بانک تجارت\nپیگیری:987654321\nحساب:3000000009012\nخرید:250000 ریال', expected: { amount: 25_000 } },
  { name: 'استرداد وجه', raw: 'بانک ملت\nاسترداد وجه خرید\nمبلغ:250,000 ریال\nمانده:40,000,000 ریال', expected: { amount: 25_000, type: 'credit', categoryId: 'refund' } },
  { name: 'برگشت وجه', raw: 'بانک ملت\nبرگشت وجه خرید\nمبلغ:250,000 ریال\nمانده:40,000,000 ریال', expected: { amount: 25_000, type: 'credit', categoryId: 'refund' } },
  { name: 'واریز امضادار', raw: '+1,000,000\n08/29_11:10\nمانده:5,000,000', expected: { amount: 100_000, type: 'credit', balance: 500_000 } },
  { name: 'برداشت امضادار', raw: '-1,000,000\n08/29_11:10\nمانده:5,000,000', expected: { amount: 100_000, type: 'debit', balance: 500_000 } },
  { name: 'حروف عربی و نیم‌فاصله', raw: 'بانك ملت\nخريد:1,850,000ريال\nپذيرنده:اسنپ‌فود\nكارت:****1234\nمانده:42,310,000ريال', expected: { amount: 185_000, merchant: 'اسنپ‌فود', categoryId: 'food', cardLast4: '1234' } },
];

const variants: [string, (raw: string) => string][] = [
  ['اصلی', raw => raw],
  ['ارقام فارسی', raw => raw.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])],
  ['ارقام عربی', raw => raw.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])],
  ['جداکننده فارسی', raw => raw.replace(/,/g, '٬')],
  ['خط خالی و CRLF', raw => raw.replace(/\n/g, '\r\n\r\n').replace(/:/g, ':  ')],
  ['نشانه جهت متن', raw => raw.replace(/\d[\d,]*/g, number => `\u200f${number}\u200e`)],
];
for (const item of cases) {
  test.each(variants)(`${item.name} — %s`, (_, transform) => {
    expect(parseSms(transform(item.raw), receipt)).toMatchObject(item.expected);
  });
}

test.each([
  ['فقط مانده', 'بانک ملت\nموجودی:4,000,000 ریال'],
  ['فقط حساب و مانده', 'بانک سپه\nحساب:3000000009012\nمانده:4,000,000'],
  ['شماره نقطه‌دار بدون مبلغ', 'بانک پاسارگاد\nواریز به:356.0000.12345678.1\nموجودی:4,000,000'],
  ['رمز در یک خط', 'بانک ملت خرید مبلغ 1,750,000 ریال کارت ****1234 رمز پویا:12345'],
  ['عملیات ناموفق', 'بانک ملت\nخرید ناموفق\nمبلغ:1,750,000 ریال\nکارت:****1234\nموجودی:4,000,000'],
])('%s نباید مبلغ قابل ثبت بسازد', (_, raw) => {
  expect(parseSms(raw, receipt).amount).toBeNull();
});

test.each(['1405/12/30-11:02', '1405/07/31-11:02', '1405/13/12-11:02'])('تاریخ نامعتبر %s روز را جابه‌جا نمی‌کند', date => {
  const result = parseSms(`بانک ملت\nخرید:1,000,000 ریال\n${date}`, receipt);
  expect(toJalali(new Date(result.date))).toMatchObject(toJalali(receipt));
});

test('کارت و پیگیری هرگز جای مبلغ نمی‌نشینند', () => {
  expect(parseSms('بانک ملت\nکارت:****9876\nپیگیری:123456789\nمانده:5,000,000', receipt).amount).toBeNull();
});

test.each(BANK_NAMES)('تشخیص نام بانک: %s', bank => {
  expect(parseSms(`${bank}\nبرداشت:1,000,000 ریال\nمانده:4,000,000 ریال`, receipt)).toMatchObject({ bank, amount: 100_000, type: 'debit' });
});
