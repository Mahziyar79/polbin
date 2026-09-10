import { parseSms } from '../src/services/smsParser';
import { FAKE_SMS_INBOX } from '../src/data/fakeSmsInbox';
import { toJalali } from '../src/utils/jalali';

describe('parseSms', () => {
  it('مبلغ خرید را می‌خواند، نه شماره‌ی حسابِ چسبیده به برچسب', () => {
    const result = parseSms(`بانک رفاه
حساب419675840
خرید1,190,000-
مانده4,621,300
06/18-08:32`);

    // ۱٬۱۹۰٬۰۰۰ ریال = ۱۱۹٬۰۰۰ تومان
    expect(result.amount).toBe(119000);
    expect(result.type).toBe('debit');
    expect(result.bank).toBe('بانک رفاه');
  });

  it('نام بانک را با فروشگاه هم‌نام اشتباه نمی‌گیرد', () => {
    const result = parseSms(`بانک رفاه
خرید1,190,000-
مانده4,621,300`);

    // «رفاه» اینجا اسم بانک است نه فروشگاه زنجیره‌ای.
    expect(result.categoryId).not.toBe('grocery');
  });

  it('مانده را به‌عنوان مبلغ برنمی‌دارد', () => {
    const result = parseSms(`بانک ملت
خريد
مبلغ: 1,850,000ريال
از: ****3421
مانده: 42,310,000ريال
پذيرنده: اسنپ‌فود`);

    expect(result.amount).toBe(185000);
    expect(result.merchant).toBe('اسنپ‌فود');
    expect(result.cardLast4).toBe('3421');
  });

  it('واریز را درآمد تشخیص می‌دهد', () => {
    const result = parseSms(`بانک ملت
واریز حقوق
مبلغ: 320,000,000 ریال
مانده: 350,000,000 ریال`);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(32000000);
  });

  it('تاریخ کامل شمسی را از متن می‌خواند', () => {
    const result = parseSms(`بانک ملت
خريد
مبلغ: 1,850,000ريال
1404/06/14-21:12`);

    const { jy, jm, jd } = toJalali(new Date(result.date));
    expect([jy, jm, jd]).toEqual([1404, 6, 14]);
    expect(new Date(result.date).getHours()).toBe(21);
  });

  it('ماه/روز بدون سال را با سال جاری می‌خواند', () => {
    const today = toJalali(new Date());
    const result = parseSms(`بانک رفاه
حساب419675840
خرید1,190,000-
مانده4,621,300
${String(today.jm).padStart(2, '0')}/${String(today.jd).padStart(2, '0')}-08:32`);

    const parsed = toJalali(new Date(result.date));
    expect([parsed.jm, parsed.jd]).toEqual([today.jm, today.jd]);
    expect(new Date(result.date).getHours()).toBe(8);
  });

  it('تاریخِ آینده را به سال قبل برمی‌گرداند', () => {
    // ۲۹ اسفند همیشه بعد از امروز است مگر همین امروز باشد.
    const result = parseSms(`بانک ملت
خرید 500,000 ریال
12/29-10:00`);

    expect(new Date(result.date).getTime()).toBeLessThanOrEqual(Date.now() + 86_400_000);
  });

  it('همه‌ی نمونه‌های واقعی مبلغ معتبر می‌دهند', () => {
    for (const sms of FAKE_SMS_INBOX) {
      const result = parseSms(sms);
      expect(result.amount).not.toBeNull();
      expect(result.amount!).toBeGreaterThan(0);
    }
  });
});
