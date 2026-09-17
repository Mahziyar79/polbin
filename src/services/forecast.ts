/**
 * پیش‌بینی آخر ماه از روی روند خرج تا امروز.
 *
 * «روزی چقدر مانده» می‌گوید چه باید بکنی؛ این می‌گوید اگر همین‌طور ادامه بدهی
 * چه می‌شود. عدد دوم است که کاربر را نگه می‌دارد: «۲۶ شهریور بودجه تمام می‌شود»
 * یک هشدار زنده است، «روزی ۱۴۷ هزار» یک عدد.
 *
 * خالص و بدون تاریخ سیستم، تا تست شود.
 */
export interface ForecastInput {
  /** سقف ماه به تومان. */
  monthly: number;
  /** خرج تا این لحظه. */
  spent: number;
  /** قسط‌های پرداخت‌نشده‌ی همین ماه — قطعاً خرج می‌شوند، پس در پیش‌بینی هستند. */
  committed: number;
  /** روز ماه شمسی، از ۱. */
  dayOfMonth: number;
  /** تعداد روزهای این ماه. */
  monthLength: number;
}

export type Forecast =
  | {
      kind: 'over';
      /** چقدر بالای سقف تمام می‌شود. */
      overBy: number;
      /** روز ماهی که سقف تمام می‌شود، یا null اگر همین امروز/قبلاً باشد. */
      runsOutDay: number | null;
    }
  | {
      kind: 'under';
      /** چقدر اضافه می‌آید. */
      leftover: number;
    };

/**
 * کمتر از این تعداد روز، روند معنی ندارد: خرج روز اول ماه (اجاره، قسط) ضرب در
 * سی، هر ماهی را «بالای سقف» پیش‌بینی می‌کند.
 */
export const MIN_DAYS_FOR_FORECAST = 3;

/** null یعنی چیزی برای گفتن نیست: هنوز زود است، یا سقف همین حالا رد شده. */
export function forecastMonth(input: ForecastInput): Forecast | null {
  const { monthly, spent, committed, dayOfMonth, monthLength } = input;

  if (monthly <= 0 || dayOfMonth < MIN_DAYS_FOR_FORECAST || dayOfMonth > monthLength) return null;
  // از سقف گذشته: کارت خودش قرمز است، پیش‌بینی چیزی اضافه نمی‌کند.
  if (spent + committed >= monthly) return null;

  const dailyRate = spent / dayOfMonth;
  const daysAhead = monthLength - dayOfMonth;
  const projected = spent + dailyRate * daysAhead + committed;

  if (projected <= monthly) {
    return { kind: 'under', leftover: Math.round(monthly - projected) };
  }

  // روزی که خرج تجمعی به سقفِ آزاد (سقف منهای قسط‌ها) می‌رسد.
  const freeCap = monthly - committed;
  const runsOutDay = dailyRate > 0 ? Math.ceil(freeCap / dailyRate) : null;

  return {
    kind: 'over',
    overBy: Math.round(projected - monthly),
    runsOutDay: runsOutDay !== null && runsOutDay > dayOfMonth && runsOutDay <= monthLength ? runsOutDay : null,
  };
}
