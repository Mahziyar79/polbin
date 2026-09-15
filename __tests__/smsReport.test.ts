import { buildSmsReport, maskNumbers } from '../src/services/smsReport';
import { parseSms } from '../src/services/smsParser';

const NL = String.fromCharCode(10);

describe('پوشاندن شماره‌ها', () => {
  it('شماره‌ی حساب چسبیده به برچسب، با چهار رقم آخر', () => {
    expect(maskNumbers('حساب419675840 خرید1,190,000-')).toBe('حساب*****5840 خرید1,190,000-');
  });

  it('مبلغ با جداکننده دست‌نخورده می‌ماند', () => {
    expect(maskNumbers('موجودی: 528,926,412 ریال')).toBe('موجودی: 528,926,412 ریال');
  });

  it('شماره‌ی کارت ۱۶ رقمی', () => {
    expect(maskNumbers('کارت 6037991234567890')).toBe('کارت ************7890');
  });

  it('کارت از قبل ستاره‌دار، دست نمی‌خورد', () => {
    expect(maskNumbers('کارت ****1234')).toBe('کارت ****1234');
  });

  it('شبا', () => {
    expect(maskNumbers('IR12 3456 7890 1234 5678 9012 34')).toContain('IR********');
  });

  it('ارقام فارسی هم پوشانده می‌شوند', () => {
    expect(maskNumbers('حساب ۴۱۹۶۷۵۸۴۰۱۲')).toBe('حساب *******4012');
  });

  it('عددهای کوتاه (ساعت، تاریخ، مبلغ بی‌جداکننده‌ی کوچک) نمی‌خورند', () => {
    expect(maskNumbers('1404/06/18-21:12 مبلغ 50000 ریال')).toBe('1404/06/18-21:12 مبلغ 50000 ریال');
  });
});

describe('متن گزارش', () => {
  const raw = ['بانک رفاه', 'حساب419675840', 'خرید1,190,000-', 'مانده4,621,300'].join(NL);
  const report = buildSmsReport(raw, parseSms(raw));

  it('پیامک پوشانده‌شده و برداشت پارسر را دارد', () => {
    expect(report).toContain('حساب*****5840');
    expect(report).not.toContain('419675840');
    expect(report).toContain('مبلغ: ۱۱۹٬۰۰۰ تومان');
    expect(report).toContain('بانک: بانک رفاه');
    expect(report).toContain('مانده: ۴۶۲٬۱۳۰ تومان');
  });

  it('جای نوشتن توضیح کاربر را دارد', () => {
    expect(report).toContain('چه چیزی اشتباه است');
  });
});
