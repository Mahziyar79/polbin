import { Category, Transaction } from '../types';
import { toJalali } from '../utils/jalali';

/**
 * نسخه‌ی قالب پشتیبان.
 *
 * هر بار که ساختار `Transaction` یا `Category` عوض شود این باید بالا برود و
 * `parseBackup` باید بداند با نسخه‌های قدیمی چه کند — وگرنه فایل پشتیبانی که
 * کاربر پارسال گرفته، امسال بی‌صدا نادیده گرفته می‌شود.
 */
const BACKUP_VERSION = 2;

export interface BackupFile {
  app: 'polbin';
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  customCategories: Category[];
  /** از نسخه‌ی ۲ اضافه شد؛ فایل‌های قدیمی‌تر ندارند. */
  monthlyBudget?: number | null;
}

export interface BackupContents {
  transactions: Transaction[];
  customCategories: Category[];
  monthlyBudget: number | null;
}

export function buildBackup(contents: BackupContents): string {
  const file: BackupFile = {
    app: 'polbin',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: contents.transactions.map(stripSensitive),
    customCategories: contents.customCategories,
    monthlyBudget: contents.monthlyBudget,
  };

  return JSON.stringify(file, null, 2);
}

/**
 * حذف متن خام پیامک از فایل پشتیبان.
 *
 * فایل پشتیبان از گوشی خارج می‌شود — کاربر آن را در تلگرام یا ایمیل می‌فرستد.
 * متن خام پیامک بانکی مانده‌ی حساب و جزئیاتی دارد که هیچ‌کدام برای بازگردانی
 * لازم نیستند و در هیچ صفحه‌ای هم خوانده نمی‌شوند.
 */
function stripSensitive(transaction: Transaction): Transaction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rawSms, ...safe } = transaction;
  return safe;
}

/** نام فایل با تاریخ شمسی تا کاربر بین چند پشتیبان گم نشود. */
export function backupFileName(date = new Date()): string {
  const { jy, jm, jd } = toJalali(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `polbin-backup-${jy}-${pad(jm)}-${pad(jd)}.json`;
}

export type ParseResult =
  | { ok: true; contents: BackupContents }
  | { ok: false; error: string };

/**
 * خواندن فایل پشتیبان با اعتبارسنجی کامل.
 *
 * سخت‌گیرانه است چون ورودی یک فایل دلخواه از بیرون اپ است: کاربر ممکن است
 * فایل اشتباهی انتخاب کند یا فایل نصفه‌نیمه باشد. بازگرداندن داده‌ی خراب،
 * بدتر از نپذیرفتن فایل است.
 */
export function parseBackup(raw: string): ParseResult {
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'فایل انتخابی یک فایل پشتیبان معتبر نیست.' };
  }

  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'ساختار فایل درست نیست.' };
  }

  const file = data as Partial<BackupFile>;

  if (file.app !== 'polbin') {
    return { ok: false, error: 'این فایل مربوط به پول‌بین نیست.' };
  }

  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'این فایل با نسخه‌ی جدیدتری از اپ ساخته شده. اول اپ را به‌روز کن.',
    };
  }

  if (!Array.isArray(file.transactions) || !Array.isArray(file.customCategories)) {
    return { ok: false, error: 'محتوای فایل ناقص است.' };
  }

  const transactions = file.transactions.filter(isValidTransaction);
  const customCategories = file.customCategories.filter(isValidCategory);

  if (transactions.length === 0 && customCategories.length === 0) {
    return { ok: false, error: 'فایل هیچ تراکنش یا دسته‌ی سالمی ندارد.' };
  }

  // فایل نسخه‌ی ۱ اصلاً بودجه ندارد؛ نبودنش خطا نیست.
  const monthlyBudget =
    typeof file.monthlyBudget === 'number' && file.monthlyBudget > 0 ? file.monthlyBudget : null;

  return { ok: true, contents: { transactions, customCategories, monthlyBudget } };
}

function isValidTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) return false;
  const tx = value as Partial<Transaction>;

  return (
    typeof tx.id === 'string' &&
    typeof tx.amount === 'number' &&
    Number.isFinite(tx.amount) &&
    tx.amount > 0 &&
    typeof tx.merchant === 'string' &&
    typeof tx.categoryId === 'string' &&
    (tx.type === 'debit' || tx.type === 'credit') &&
    typeof tx.date === 'string' &&
    !Number.isNaN(new Date(tx.date).getTime())
  );
}

function isValidCategory(value: unknown): value is Category {
  if (typeof value !== 'object' || value === null) return false;
  const category = value as Partial<Category>;

  return (
    typeof category.id === 'string' &&
    typeof category.label === 'string' &&
    typeof category.color === 'string' &&
    typeof category.emoji === 'string' &&
    (category.kind === 'debit' || category.kind === 'credit')
  );
}
