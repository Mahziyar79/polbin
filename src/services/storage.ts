import { createMMKV } from 'react-native-mmkv';

/**
 * ذخیره‌سازی محلی روی خود گوشی.
 *
 * خواندن همگام است، پس مقادیر ذخیره‌شده را می‌شود مستقیم به‌عنوان مقدار
 * اولیه‌ی `useState` داد و هیچ حالت «در حال بارگذاری» لازم نیست.
 *
 * کلیدها نسخه‌دار (`.v1`) هستند تا اگر ساختار داده عوض شد، نسخه‌ی جدید
 * داده‌ی قدیمی را نخواند و اپ با داده‌ی ناسازگار نشکند.
 */
export const storage = createMMKV({ id: 'polbin' });

export const STORAGE_KEYS = {
  profile: 'profile.v1',
  customCategories: 'categories.custom.v1',
  transactions: 'transactions.v1',
  onboardingSeen: 'onboarding.seen.v1',
} as const;

/**
 * خواندن مقدار JSON. اگر کلید نبود یا داده خراب بود، `fallback` برمی‌گردد —
 * داده‌ی خراب هرگز نباید اپ را بیندازد.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    storage.remove(key);
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {
    // نوشتن ناموفق نباید جریان کاربر را قطع کند؛ داده در حافظه سالم است.
  }
}

export function removeKey(key: string): void {
  try {
    storage.remove(key);
  } catch {
    // چیزی برای انجام دادن نیست.
  }
}
