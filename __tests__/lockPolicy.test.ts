import {
  cooldownMs,
  isValidPin,
  MAX_FREE_ATTEMPTS,
  RESUME_GRACE_MS,
  shouldLockOnResume,
} from '../src/services/lockPolicy';

describe('قفل شدن بعد از پس‌زمینه', () => {
  const now = 1_000_000;

  it('اگر اصلاً به پس‌زمینه نرفته، قفل نمی‌شود', () => {
    expect(shouldLockOnResume(null, now)).toBe(false);
  });

  it('برگشت سریع (منوی هم‌رسانی، انتخاب فایل) قفل نمی‌شود', () => {
    expect(shouldLockOnResume(now - 5_000, now)).toBe(false);
    expect(shouldLockOnResume(now - RESUME_GRACE_MS, now)).toBe(false);
  });

  it('بعد از مهلت قفل می‌شود', () => {
    expect(shouldLockOnResume(now - RESUME_GRACE_MS - 1, now)).toBe(true);
    expect(shouldLockOnResume(now - 10 * 60_000, now)).toBe(true);
  });
});

describe('فاصله‌ی اجباری بعد از رمز غلط', () => {
  it('تا پنج تلاش آزاد است', () => {
    for (let i = 0; i < MAX_FREE_ATTEMPTS; i++) expect(cooldownMs(i)).toBe(0);
  });

  it('از تلاش پنجم به بعد دو برابر می‌شود', () => {
    expect(cooldownMs(5)).toBe(30_000);
    expect(cooldownMs(6)).toBe(60_000);
    expect(cooldownMs(7)).toBe(120_000);
  });

  it('سقف پنج دقیقه', () => {
    expect(cooldownMs(20)).toBe(5 * 60_000);
    expect(cooldownMs(100)).toBe(5 * 60_000);
  });
});

describe('رمز معتبر', () => {
  it('دقیقاً چهار رقم لاتین', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('۱۲۳۴')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });
});
