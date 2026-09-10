import {
  balanceOf,
  buildBreakdown,
  dayKey,
  groupByDay,
  totalIncome,
  totalSpend,
  withinJalaliMonth,
  withinLastDays,
} from '../src/services/analytics';
import { BUILT_IN_CATEGORIES } from '../src/data/categories';
import { Transaction, TransactionType } from '../src/types';
import { toGregorian, toJalali } from '../src/utils/jalali';

let nextId = 0;

/** تراکنش نمونه؛ فقط چیزی که هر تست لازم دارد را می‌دهد. */
function tx(
  amount: number,
  type: TransactionType,
  date: Date = new Date(),
  categoryId = 'other',
): Transaction {
  nextId += 1;
  return {
    id: `tx_${nextId}`,
    amount,
    merchant: 'نمونه',
    categoryId,
    date: date.toISOString(),
    type,
  };
}

/** امروز در ساعتی مشخص — تا تست به لحظه‌ی اجرا حساس نباشد. */
function todayAt(hour: number): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
}

function daysAgoAt(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

describe('جمع‌ها', () => {
  const sample = [tx(100_000, 'debit'), tx(250_000, 'debit'), tx(1_000_000, 'credit')];

  it('totalSpend فقط خرج را جمع می‌کند', () => {
    expect(totalSpend(sample)).toBe(350_000);
  });

  it('totalIncome فقط درآمد را جمع می‌کند', () => {
    expect(totalIncome(sample)).toBe(1_000_000);
  });

  it('balanceOf یعنی درآمد منهای خرج', () => {
    expect(balanceOf(sample)).toBe(650_000);
  });

  it('وقتی خرج از درآمد بیشتر باشد مانده منفی است', () => {
    expect(balanceOf([tx(900_000, 'debit'), tx(200_000, 'credit')])).toBe(-700_000);
  });

  it('لیست خالی صفر می‌دهد، نه NaN', () => {
    expect(totalSpend([])).toBe(0);
    expect(totalIncome([])).toBe(0);
    expect(balanceOf([])).toBe(0);
  });

  it('لیستی که فقط درآمد دارد خرجش صفر است', () => {
    expect(totalSpend([tx(500_000, 'credit')])).toBe(0);
  });
});

describe('withinLastDays', () => {
  it('«۱ روز» یعنی از نیمه‌شب امروز، نه ۲۴ ساعت گذشته', () => {
    // خرج دیشب ساعت ۲۳ نباید در «امروز» بیاید، حتی اگر کمتر از ۲۴ ساعت گذشته باشد.
    const lastNight = daysAgoAt(1, 23);
    const thisMorning = todayAt(1);

    const result = withinLastDays([tx(1000, 'debit', lastNight), tx(2000, 'debit', thisMorning)], 1);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(2000);
  });

  it('«۷ روز» یعنی امروز و شش روز قبلش', () => {
    const list = [
      tx(1, 'debit', todayAt(12)),
      tx(2, 'debit', daysAgoAt(6, 12)),
      tx(3, 'debit', daysAgoAt(7, 12)),
    ];

    expect(withinLastDays(list, 7).map(t => t.amount).sort()).toEqual([1, 2]);
  });

  it('بازه‌ی خالی چیزی برنمی‌گرداند', () => {
    expect(withinLastDays([], 30)).toEqual([]);
  });
});

describe('withinJalaliMonth', () => {
  /** روز پانزدهمِ ماه شمسیِ `monthsBack` ماه قبل — همیشه داخل همان ماه است. */
  function midOfMonth(monthsBack: number): Date {
    const { jy, jm } = toJalali(new Date());
    let year = jy;
    let month = jm - monthsBack;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    const date = toGregorian(year, month, 15);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  it('ماه جاری فقط تراکنش‌های همین ماه را می‌دهد', () => {
    const list = [
      tx(100, 'debit', midOfMonth(0)),
      tx(200, 'debit', midOfMonth(1)),
      tx(300, 'debit', midOfMonth(2)),
    ];

    expect(withinJalaliMonth(list, 0).map(t => t.amount)).toEqual([100]);
  });

  it('ماه قبل فقط تراکنش‌های ماه قبل را می‌دهد', () => {
    const list = [tx(100, 'debit', midOfMonth(0)), tx(200, 'debit', midOfMonth(1))];

    expect(withinJalaliMonth(list, 1).map(t => t.amount)).toEqual([200]);
  });

  it('هر تراکنش دقیقاً در یک ماه می‌افتد، نه دو تا و نه هیچ', () => {
    const list = [midOfMonth(0), midOfMonth(1), midOfMonth(2)].map(d => tx(1, 'debit', d));

    const counted =
      withinJalaliMonth(list, 0).length +
      withinJalaliMonth(list, 1).length +
      withinJalaliMonth(list, 2).length;

    expect(counted).toBe(list.length);
  });
});

describe('groupByDay', () => {
  it('تراکنش‌های یک روز را کنار هم می‌گذارد', () => {
    const morning = todayAt(9);
    const evening = todayAt(21);
    const yesterday = daysAgoAt(1, 12);

    const groups = groupByDay([
      tx(1, 'debit', morning),
      tx(2, 'debit', evening),
      tx(3, 'debit', yesterday),
    ]);

    expect(groups.size).toBe(2);
    expect(groups.get(dayKey(morning))).toHaveLength(2);
    expect(groups.get(dayKey(yesterday))).toHaveLength(1);
  });

  it('ساعت در کلید روز اثری ندارد', () => {
    expect(dayKey(todayAt(0))).toBe(dayKey(todayAt(23)));
  });
});

describe('buildBreakdown', () => {
  const list = [
    tx(300_000, 'debit', todayAt(10), 'food'),
    tx(100_000, 'debit', todayAt(11), 'food'),
    tx(600_000, 'debit', todayAt(12), 'grocery'),
    tx(9_000_000, 'credit', todayAt(13), 'salary'),
  ];

  it('فقط نوع خواسته‌شده را حساب می‌کند', () => {
    const result = buildBreakdown(list, BUILT_IN_CATEGORIES, 'debit');
    expect(result.map(item => item.category.id)).toEqual(['grocery', 'food']);
  });

  it('از بزرگ به کوچک مرتب می‌شود', () => {
    const totals = buildBreakdown(list, BUILT_IN_CATEGORIES).map(item => item.total);
    expect(totals).toEqual([600_000, 400_000]);
  });

  it('تعداد تراکنش هر دسته را می‌شمارد', () => {
    const food = buildBreakdown(list, BUILT_IN_CATEGORIES).find(i => i.category.id === 'food');
    expect(food?.count).toBe(2);
  });

  it('درصدها روی هم ۱۰۰ می‌شوند', () => {
    const shares = buildBreakdown(list, BUILT_IN_CATEGORIES).map(item => item.share);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(100);
  });

  it('برای درآمد هم کار می‌کند', () => {
    const result = buildBreakdown(list, BUILT_IN_CATEGORIES, 'credit');
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(9_000_000);
    expect(result[0].share).toBeCloseTo(100);
  });

  it('دسته‌ی ناشناس به دسته‌ی پیش‌فرض می‌افتد، نه اینکه بیفتد بیرون', () => {
    // دسته‌ای که کاربر ساخته و بعد حذف شده؛ تراکنشش نباید از گزارش گم شود.
    const result = buildBreakdown(
      [tx(50_000, 'debit', todayAt(10), 'deleted_category')],
      BUILT_IN_CATEGORIES,
    );

    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(50_000);
    expect(result[0].category.id).toBe('other');
  });

  it('لیست خالی، تفکیک خالی می‌دهد', () => {
    expect(buildBreakdown([], BUILT_IN_CATEGORIES)).toEqual([]);
  });
});
