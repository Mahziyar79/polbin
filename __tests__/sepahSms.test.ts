import { parseSms } from '../src/services/smsParser';
import { toGregorian, toJalali } from '../src/utils/jalali';

// Same layout as the supplied SMS; the account number is synthetic.
const sepahSms = `بانک سپه

برداشت:77,419,000

حساب : 3000000009012 

مانده:17,602,250

8/29-7:01

دريافت اتوماتيک  قسط مورخ`;
const receivedAt = toGregorian(1405, 8, 29);

test('برداشت خودکار قسط سپه، با وجود واژهٔ دریافت، هزینه است', () => {
  const result = parseSms(sepahSms, receivedAt);
  expect(result).toMatchObject({ bank: 'بانک سپه', amount: 7_741_900, balance: 1_760_225, type: 'debit', merchant: 'پرداخت قسط', categoryId: 'other', accountLast4: '9012', cardLast4: null });
  expect(toJalali(new Date(result.date))).toMatchObject({ jy: 1405, jm: 8, jd: 29 });
  expect(new Date(result.date).getHours()).toBe(7);
  expect(new Date(result.date).getMinutes()).toBe(1);
});

test('همان برداشت با حروف و ارقام فارسی هم هزینه است', () => {
  const raw = sepahSms.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]).replace('دريافت اتوماتيک', 'دریافت خودکار');
  expect(parseSms(raw, receivedAt)).toMatchObject({ amount: 7_741_900, type: 'debit', merchant: 'پرداخت قسط' });
});

test('دریافت واقعی و برگشت وجه همچنان درآمد هستند', () => {
  expect(parseSms('بانک سپه واریز:77,419,000 حساب:3000000009012 مانده:90,000,000 دریافت وجه', receivedAt).type).toBe('credit');
  expect(parseSms('بانک سپه برگشت وجه خرید به حساب شما مبلغ 100,000 ریال مانده 2,000,000', receivedAt).type).toBe('credit');
});
