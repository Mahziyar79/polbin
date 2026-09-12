/**
 * قواعد قفل اپ — خالص و بدون وابستگی، تا تست شود.
 *
 * دو تصمیم اینجاست: کِی بعد از برگشتن از پس‌زمینه دوباره قفل کنیم، و بعد از
 * چند رمز غلط چقدر صبر بدهیم.
 */

/**
 * مهلت بعد از رفتن به پس‌زمینه.
 *
 * صفر نیست چون خودِ اپ کاربر را به بیرون می‌فرستد: منوی هم‌رسانی، انتخاب
 * فایل پشتیبان، پنجره‌ی چاپ. اگر با هر برگشت قفل می‌شد، گرفتن یک خروجی
 * اکسل سه بار رمز می‌خواست. بیست ثانیه برای این کارها کافی است و برای کسی که
 * گوشی را روی میز گذاشته و رفته، کوتاه.
 */
export const RESUME_GRACE_MS = 20_000;

/** بعد از این تعداد رمز غلط پشت‌هم، فاصله‌ی اجباری شروع می‌شود. */
export const MAX_FREE_ATTEMPTS = 5;

/** فاصله‌ی اجباری: با هر خطای بعدی دو برابر می‌شود، تا سقف. */
const BASE_COOLDOWN_MS = 30_000;
const MAX_COOLDOWN_MS = 5 * 60_000;

export function shouldLockOnResume(
  backgroundAt: number | null,
  now: number,
  grace = RESUME_GRACE_MS,
): boolean {
  if (backgroundAt === null) return false;
  return now - backgroundAt > grace;
}

/**
 * چند میلی‌ثانیه باید صبر کند — صفر یعنی می‌تواند امتحان کند.
 *
 * رمز چهاررقمی ده هزار حالت دارد؛ بدون این، حدس زدنش با انگشت چند دقیقه است.
 * با این، بعد از پنج تلاش هر حدس ۳۰ ثانیه، بعد ۶۰، بعد ۱۲۰ … تا پنج دقیقه.
 */
export function cooldownMs(failedAttempts: number): number {
  if (failedAttempts < MAX_FREE_ATTEMPTS) return 0;
  const extra = failedAttempts - MAX_FREE_ATTEMPTS;
  return Math.min(MAX_COOLDOWN_MS, BASE_COOLDOWN_MS * 2 ** extra);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
