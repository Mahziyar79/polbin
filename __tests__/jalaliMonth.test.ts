import {
  daysLeftInJalaliMonth,
  jalaliMonthLength,
  jalaliMonthName,
  jalaliMonthRange,
  toGregorian,
  toJalali,
} from '../src/utils/jalali';

/** میانه‌ی روز تا اختلاف ساعت مرزها را جابه‌جا نکند. */
function jalali(jy: number, jm: number, jd: number): Date {
  const date = toGregorian(jy, jm, jd);
  date.setHours(12, 0, 0, 0);
  return date;
}

describe('jalaliMonthRange', () => {
  it('ماه جاری از روز اول تا اول ماه بعد است', () => {
    const { start, end } = jalaliMonthRange(jalali(1405, 6, 18));

    expect(toJalali(start)).toMatchObject({ jy: 1405, jm: 6, jd: 1 });
    expect(toJalali(end)).toMatchObject({ jy: 1405, jm: 7, jd: 1 });
    expect(start.getHours()).toBe(0);
  });

  it('ماه قبل را درست برمی‌گرداند', () => {
    const { start, end } = jalaliMonthRange(jalali(1405, 6, 18), 1);

    expect(toJalali(start)).toMatchObject({ jy: 1405, jm: 5, jd: 1 });
    expect(toJalali(end)).toMatchObject({ jy: 1405, jm: 6, jd: 1 });
  });

  it('از فروردین به اسفند سال قبل می‌رود', () => {
    const { start, end } = jalaliMonthRange(jalali(1405, 1, 5), 1);

    expect(toJalali(start)).toMatchObject({ jy: 1404, jm: 12, jd: 1 });
    expect(toJalali(end)).toMatchObject({ jy: 1405, jm: 1, jd: 1 });
  });

  it('اسفند تا فروردین سال بعد کشیده می‌شود', () => {
    const { end } = jalaliMonthRange(jalali(1404, 12, 10));
    expect(toJalali(end)).toMatchObject({ jy: 1405, jm: 1, jd: 1 });
  });

  it('طول هر ماه با jalaliMonthLength جور است', () => {
    for (let month = 1; month <= 12; month++) {
      const { start, end } = jalaliMonthRange(jalali(1404, month, 1));
      const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
      expect(days).toBe(jalaliMonthLength(1404, month));
    }
  });
});

describe('daysLeftInJalaliMonth', () => {
  it('روز اول شهریور یعنی ۳۱ روز مانده', () => {
    expect(daysLeftInJalaliMonth(jalali(1405, 6, 1))).toBe(31);
  });

  it('روز آخر یعنی یک روز مانده', () => {
    expect(daysLeftInJalaliMonth(jalali(1405, 7, 30))).toBe(1);
  });
});

describe('jalaliMonthName', () => {
  it('نام ماه جاری و ماه قبل', () => {
    const shahrivar = jalali(1405, 6, 18);
    expect(jalaliMonthName(shahrivar)).toBe('شهریور');
    expect(jalaliMonthName(shahrivar, 1)).toBe('مرداد');
  });

  it('از فروردین به اسفند می‌پیچد', () => {
    expect(jalaliMonthName(jalali(1405, 1, 5), 1)).toBe('اسفند');
  });
});
