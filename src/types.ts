export type TransactionType = 'debit' | 'credit';

/** دسته‌های از پیش تعریف‌شده؛ پارسر پیامک فقط همین‌ها را برمی‌گرداند. */
export type BuiltInCategoryId =
  | 'food'
  | 'grocery'
  | 'transport'
  | 'bills'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'transfer'
  | 'other';

/** کاربر می‌تواند دسته‌ی دلخواه بسازد، پس شناسه رشته‌ی آزاد است. */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  emoji: string;
  /** دسته‌ی خرج است یا درآمد — هر تراکنش فقط دسته‌های هم‌نوع خودش را می‌بیند. */
  kind: TransactionType;
  /** دسته‌های ساخته‌ی کاربر؛ فقط این‌ها قابل حذف‌اند. */
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  /** مبلغ به تومان */
  amount: number;
  merchant: string;
  categoryId: CategoryId;
  /** ISO 8601 */
  date: string;
  bank?: string;
  cardLast4?: string;
  type: TransactionType;
  rawSms?: string;
}

/** خروجی سرویس پارس پیامک (در نسخه‌ی نهایی از بک‌اند می‌آید). */
export interface ParsedSms {
  amount: number | null;
  merchant: string | null;
  categoryId: CategoryId;
  date: string;
  bank: string | null;
  cardLast4: string | null;
  type: TransactionType;
  /** میزان اطمینان پارسر بین ۰ تا ۱ */
  confidence: number;
  raw: string;
}

/** پروفایل محلی کاربر. نام خالی یعنی کاربر هنوز اسمش را نگفته. */
export interface Profile {
  displayName: string;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  share: number;
  count: number;
}

export type InsightTone = 'positive' | 'warning' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  /** توصیه‌ی عملی و کوتاه */
  action: string;
}
