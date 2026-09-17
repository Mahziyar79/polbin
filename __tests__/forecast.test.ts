import { forecastMonth, MIN_DAYS_FOR_FORECAST } from '../src/services/forecast';

const base = { monthly: 30_000_000, committed: 0, monthLength: 31 };

describe('forecastMonth', () => {
  it('روند کمتر از سقف: اضافه می‌آورد', () => {
    // روزی ۵۰۰ هزار × ۳۱ روز = ۱۵٫۵ میلیون از ۳۰ میلیون
    const result = forecastMonth({ ...base, spent: 5_000_000, dayOfMonth: 10 });
    expect(result).toEqual({ kind: 'under', leftover: 14_500_000 });
  });

  it('روند بیشتر از سقف: روز تمام شدن و مقدار اضافه', () => {
    // روزی ۱٫۵ میلیون؛ سقف ۳۰ میلیون روز بیستم تمام می‌شود، آخر ماه ۴۶٫۵ میلیون
    const result = forecastMonth({ ...base, spent: 15_000_000, dayOfMonth: 10 });
    expect(result).toEqual({ kind: 'over', overBy: 16_500_000, runsOutDay: 20 });
  });

  it('قسط‌های ماه در پیش‌بینی هستند و سقف آزاد را کم می‌کنند', () => {
    // روزی ۵۰۰ هزار → ۱۵٫۵ میلیون + ۲۰ میلیون قسط = ۳۵٫۵ > ۳۰
    const result = forecastMonth({ ...base, spent: 5_000_000, dayOfMonth: 10, committed: 20_000_000 });
    expect(result).toEqual({ kind: 'over', overBy: 5_500_000, runsOutDay: 20 });
  });

  it('روزهای اول ماه هنوز زود است', () => {
    expect(forecastMonth({ ...base, spent: 3_000_000, dayOfMonth: MIN_DAYS_FOR_FORECAST - 1 })).toBeNull();
    expect(forecastMonth({ ...base, spent: 3_000_000, dayOfMonth: MIN_DAYS_FOR_FORECAST })).not.toBeNull();
  });

  it('وقتی سقف همین حالا رد شده، پیش‌بینی نمی‌دهد', () => {
    expect(forecastMonth({ ...base, spent: 31_000_000, dayOfMonth: 10 })).toBeNull();
    expect(forecastMonth({ ...base, spent: 5_000_000, committed: 25_000_000, dayOfMonth: 10 })).toBeNull();
  });

  it('بدون خرج، همه‌ی سقف اضافه می‌آید', () => {
    expect(forecastMonth({ ...base, spent: 0, dayOfMonth: 10 })).toEqual({ kind: 'under', leftover: 30_000_000 });
  });

  it('روز آخر ماه پیش‌بینی همان خرج تا امروز است', () => {
    expect(forecastMonth({ ...base, spent: 20_000_000, dayOfMonth: 31 })).toEqual({
      kind: 'under',
      leftover: 10_000_000,
    });
  });

  it('روز تمام شدن بعد از آخر ماه، null است (فقط مقدار اضافه می‌ماند)', () => {
    // روزی ۱ میلیون در ماه ۳۰ روزه با سقف ۲۹٫۵: روز ۳۰ تمام می‌شود — داخل ماه
    const inside = forecastMonth({ monthly: 29_500_000, committed: 0, monthLength: 30, spent: 10_000_000, dayOfMonth: 10 });
    expect(inside).toEqual({ kind: 'over', overBy: 500_000, runsOutDay: 30 });
  });
});
