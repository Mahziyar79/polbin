import {
  dueDateOf,
  dueInJalaliMonth,
  expand,
  isFinished,
  nextUnpaid,
  remainingAmount,
  remainingCount,
  soonestUnpaid,
  unpaidThisMonth,
} from '../src/services/installments';
import { Installment } from '../src/types';
import { addJalaliMonths, daysUntil, toGregorian, toJalali } from '../src/utils/jalali';

function jalali(jy: number, jm: number, jd: number): Date {
  const date = toGregorian(jy, jm, jd);
  date.setHours(0, 0, 0, 0);
  return date;
}

function plan(over: Partial<Installment> = {}): Installment {
  return {
    id: 'p1',
    title: 'وام خودرو',
    amount: 3_000_000,
    count: 36,
    firstDueDate: jalali(1405, 6, 10).toISOString(),
    paid: [],
    ...over,
  };
}

describe('addJalaliMonths', () => {
  it('روز را نگه می‌دارد', () => {
    expect(toJalali(addJalaliMonths(jalali(1405, 6, 10), 1))).toMatchObject({
      jy: 1405,
      jm: 7,
      jd: 10,
    });
  });

  it('از اسفند به فروردین سال بعد می‌رود', () => {
    expect(toJalali(addJalaliMonths(jalali(1404, 12, 5), 1))).toMatchObject({
      jy: 1405,
      jm: 1,
      jd: 5,
    });
  });

  it('روزی که در ماه مقصد نیست به آخر ماه می‌چسبد', () => {
    // ۳۱ شهریور هست، ۳۱ مهر نیست (مهر ۳۰ روز است).
    expect(toJalali(addJalaliMonths(jalali(1405, 6, 31), 1))).toMatchObject({ jm: 7, jd: 30 });
  });

  it('روز چسبیده‌شده ماه‌های بعدی را جلو نمی‌اندازد', () => {
    // اگر روز را دائمی تغییر می‌دادیم، همه‌ی سررسیدهای بعدی خراب می‌شدند.
    const start = jalali(1405, 6, 31);
    expect(toJalali(addJalaliMonths(start, 2))).toMatchObject({ jm: 8, jd: 30 });
    expect(toJalali(addJalaliMonths(start, 6))).toMatchObject({ jm: 12, jd: 29 });
  });

  it('۱۲ ماه یعنی یک سال بعد', () => {
    expect(toJalali(addJalaliMonths(jalali(1405, 6, 10), 12))).toMatchObject({
      jy: 1406,
      jm: 6,
      jd: 10,
    });
  });
});

describe('سررسید اقساط', () => {
  it('قسط اول همان تاریخ شروع است', () => {
    const p = plan();
    expect(dueDateOf(p, 1).getTime()).toBe(new Date(p.firstDueDate).getTime());
  });

  it('هر قسط یک ماه شمسی بعد از قبلی است', () => {
    const p = plan();
    expect(toJalali(dueDateOf(p, 4))).toMatchObject({ jy: 1405, jm: 9, jd: 10 });
  });

  it('expand به تعداد اقساط ردیف می‌دهد', () => {
    expect(expand(plan({ count: 12 })).length).toBe(12);
  });
});

describe('وضعیت هر قسط', () => {
  const now = jalali(1405, 6, 19);

  it('پرداخت‌شده، paid است حتی اگر سررسیدش گذشته باشد', () => {
    const items = expand(plan({ paid: [1] }), now);
    expect(items[0].status).toBe('paid');
  });

  it('پرداخت‌نشده‌ی گذشته overdue است', () => {
    const items = expand(plan(), now);
    expect(items[0].status).toBe('overdue');
    expect(items[0].daysLeft).toBeLessThan(0);
  });

  it('سررسید امروز today است', () => {
    const items = expand(plan({ firstDueDate: now.toISOString() }), now);
    expect(items[0].status).toBe('today');
    expect(items[0].daysLeft).toBe(0);
  });

  it('تا یک هفته‌ی آینده soon است و بعدش later', () => {
    const inFive = expand(plan({ firstDueDate: jalali(1405, 6, 24).toISOString() }), now);
    const inTwenty = expand(plan({ firstDueDate: jalali(1405, 7, 9).toISOString() }), now);

    expect(inFive[0].status).toBe('soon');
    expect(inTwenty[0].status).toBe('later');
  });
});

describe('قسط بعدی', () => {
  const now = jalali(1405, 6, 19);

  it('اولین پرداخت‌نشده است، نه اولین آینده', () => {
    // قسط ۱ سررسیدش گذشته و پرداخت نشده — نباید پنهان شود.
    const next = nextUnpaid(plan(), now);
    expect(next?.number).toBe(1);
    expect(next?.status).toBe('overdue');
  });

  it('پرداخت‌شده‌ها را رد می‌کند', () => {
    expect(nextUnpaid(plan({ paid: [1, 2] }), now)?.number).toBe(3);
  });

  it('وقتی همه پرداخت شده‌اند null می‌دهد', () => {
    expect(nextUnpaid(plan({ count: 2, paid: [1, 2] }), now)).toBeNull();
  });
});

describe('باقی‌مانده', () => {
  it('تعداد و مبلغ باقی‌مانده', () => {
    const p = plan({ count: 10, paid: [1, 2, 3] });
    expect(remainingCount(p)).toBe(7);
    expect(remainingAmount(p)).toBe(21_000_000);
  });

  it('تمام‌شده وقتی چیزی نمانده', () => {
    expect(isFinished(plan({ count: 2, paid: [1, 2] }))).toBe(true);
    expect(isFinished(plan({ count: 2, paid: [1] }))).toBe(false);
  });
});

describe('اقساط ماه جاری', () => {
  const now = jalali(1405, 6, 19);

  it('فقط اقساطی که در همین ماه سررسید دارند', () => {
    const p = plan({ firstDueDate: jalali(1405, 6, 10).toISOString(), count: 12 });
    const due = dueInJalaliMonth([p], 0, now);

    expect(due).toHaveLength(1);
    expect(due[0].number).toBe(1);
  });

  it('مجموع پرداخت‌نشده‌ی ماه، پرداخت‌شده‌ها را حساب نمی‌کند', () => {
    const a = plan({ id: 'a', amount: 1_000_000, firstDueDate: jalali(1405, 6, 5).toISOString() });
    const b = plan({
      id: 'b',
      amount: 2_000_000,
      firstDueDate: jalali(1405, 6, 25).toISOString(),
      paid: [1],
    });

    expect(unpaidThisMonth([a, b], now)).toBe(1_000_000);
  });

  it('چند برنامه با هم، مرتب بر اساس تاریخ', () => {
    const a = plan({ id: 'a', firstDueDate: jalali(1405, 6, 25).toISOString() });
    const b = plan({ id: 'b', firstDueDate: jalali(1405, 6, 5).toISOString() });

    const due = dueInJalaliMonth([a, b], 0, now);
    expect(due.map(d => d.plan.id)).toEqual(['b', 'a']);
  });
});

describe('نزدیک‌ترین سررسید', () => {
  const now = jalali(1405, 6, 19);

  it('بین چند برنامه، نزدیک‌ترین را می‌دهد', () => {
    const far = plan({ id: 'far', firstDueDate: jalali(1405, 8, 1).toISOString() });
    const near = plan({ id: 'near', firstDueDate: jalali(1405, 6, 25).toISOString() });

    expect(soonestUnpaid([far, near], now)?.plan.id).toBe('near');
  });

  it('برنامه‌ی تمام‌شده را نادیده می‌گیرد', () => {
    const done = plan({ id: 'done', count: 1, paid: [1] });
    expect(soonestUnpaid([done], now)).toBeNull();
  });
});

describe('daysUntil', () => {
  it('فردا یک، دیروز منفی یک', () => {
    const today = jalali(1405, 6, 19);
    expect(daysUntil(jalali(1405, 6, 20), today)).toBe(1);
    expect(daysUntil(jalali(1405, 6, 18), today)).toBe(-1);
    expect(daysUntil(today, today)).toBe(0);
  });
});
