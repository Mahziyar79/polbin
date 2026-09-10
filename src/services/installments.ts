import { Installment } from '../types';
import { addJalaliMonths, daysUntil, jalaliMonthRange } from '../utils/jalali';

/** وضعیت یک قسط نسبت به امروز. */
export type DueStatus = 'paid' | 'overdue' | 'today' | 'soon' | 'later';

export interface DueInstallment {
  plan: Installment;
  /** شماره‌ی قسط، از ۱. */
  number: number;
  dueDate: Date;
  paid: boolean;
  status: DueStatus;
  /** منفی یعنی گذشته. */
  daysLeft: number;
}

/** «به‌زودی» یعنی تا یک هفته‌ی آینده. */
const SOON_DAYS = 7;

/** سررسید قسط شماره‌ی `number` (از ۱). */
export function dueDateOf(plan: Installment, number: number): Date {
  return addJalaliMonths(new Date(plan.firstDueDate), number - 1);
}

function statusOf(paid: boolean, daysLeft: number): DueStatus {
  if (paid) return 'paid';
  if (daysLeft < 0) return 'overdue';
  if (daysLeft === 0) return 'today';
  return daysLeft <= SOON_DAYS ? 'soon' : 'later';
}

/** همه‌ی اقساط یک برنامه، از اولی تا آخری. */
export function expand(plan: Installment, now = new Date()): DueInstallment[] {
  const items: DueInstallment[] = [];

  for (let number = 1; number <= plan.count; number++) {
    const dueDate = dueDateOf(plan, number);
    const paid = plan.paid.includes(number);
    const daysLeft = daysUntil(dueDate, now);

    items.push({ plan, number, dueDate, paid, status: statusOf(paid, daysLeft), daysLeft });
  }

  return items;
}

/**
 * قسط بعدیِ پرداخت‌نشده.
 *
 * عمداً اولین پرداخت‌نشده است، نه اولینِ آینده: قسطی که سررسیدش گذشته و پرداخت
 * نشده مهم‌تر از قسط ماه بعد است و نباید از دید کاربر پنهان شود.
 */
export function nextUnpaid(plan: Installment, now = new Date()): DueInstallment | null {
  return expand(plan, now).find(item => !item.paid) ?? null;
}

export function remainingCount(plan: Installment): number {
  return plan.count - plan.paid.length;
}

export function remainingAmount(plan: Installment): number {
  return remainingCount(plan) * plan.amount;
}

export function isFinished(plan: Installment): boolean {
  return remainingCount(plan) <= 0;
}

/** همه‌ی اقساط همه‌ی برنامه‌ها که در ماه شمسی جاری سررسید دارند. */
export function dueInJalaliMonth(
  plans: Installment[],
  monthsBack = 0,
  now = new Date(),
): DueInstallment[] {
  const { start, end } = jalaliMonthRange(now, monthsBack);
  const from = start.getTime();
  const to = end.getTime();

  return plans
    .flatMap(plan => expand(plan, now))
    .filter(item => {
      const time = item.dueDate.getTime();
      return time >= from && time < to;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/** مجموع اقساط پرداخت‌نشده‌ی ماه جاری — همان چیزی که هنوز باید کنار بگذارد. */
export function unpaidThisMonth(plans: Installment[], now = new Date()): number {
  return dueInJalaliMonth(plans, 0, now)
    .filter(item => !item.paid)
    .reduce((sum, item) => sum + item.plan.amount, 0);
}

/** نزدیک‌ترین سررسید پرداخت‌نشده در بین همه‌ی برنامه‌ها. */
export function soonestUnpaid(plans: Installment[], now = new Date()): DueInstallment | null {
  const candidates = plans
    .map(plan => nextUnpaid(plan, now))
    .filter((item): item is DueInstallment => item !== null)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return candidates[0] ?? null;
}
