import { Category, CategoryId, TransactionType } from '../types';

/** دسته‌ای که وقتی چیزی پیدا نشد یا دسته‌ای حذف شد، جایگزین می‌شود. */
export const EXPENSE_FALLBACK_ID = 'other';
export const INCOME_FALLBACK_ID = 'income_other';

export function fallbackIdFor(kind: TransactionType): CategoryId {
  return kind === 'credit' ? INCOME_FALLBACK_ID : EXPENSE_FALLBACK_ID;
}

/**
 * رنگ دسته‌ها عمداً هیچ‌کدام سبزآبیِ برند نیست.
 * `primary` فقط برای عناصر تعاملی (دکمه، تب فعال، لینک) نگه داشته شده تا
 * کاربر رنگ یک دسته را با «چیزی که می‌شود لمسش کرد» اشتباه نگیرد.
 */
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: 'رستوران و کافه', color: '#F5821F', emoji: '🍔', kind: 'debit' },
  { id: 'grocery', label: 'خواربار و سوپرمارکت', color: '#16B86A', emoji: '🛒', kind: 'debit' },
  { id: 'transport', label: 'حمل و نقل', color: '#3B6FE0', emoji: '🚕', kind: 'debit' },
  { id: 'bills', label: 'قبوض و شارژ', color: '#8B5CF6', emoji: '🧾', kind: 'debit' },
  { id: 'shopping', label: 'خرید و پوشاک', color: '#DB4E8C', emoji: '🛍️', kind: 'debit' },
  { id: 'health', label: 'سلامت و دارو', color: '#00C2CB', emoji: '💊', kind: 'debit' },
  { id: 'entertainment', label: 'سرگرمی', color: '#FFC52E', emoji: '🎬', kind: 'debit' },
  { id: 'transfer', label: 'انتقال وجه', color: '#64818A', emoji: '🔁', kind: 'debit' },
  { id: EXPENSE_FALLBACK_ID, label: 'متفرقه', color: '#A7BCC1', emoji: '📦', kind: 'debit' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'حقوق و دستمزد', color: '#0FA958', emoji: '💼', kind: 'credit' },
  { id: 'freelance', label: 'پروژه و فریلنس', color: '#00A9B5', emoji: '💻', kind: 'credit' },
  { id: 'rent_income', label: 'اجاره و سود', color: '#4C7DF0', emoji: '🏠', kind: 'credit' },
  { id: 'sale', label: 'فروش', color: '#F5A623', emoji: '🏷️', kind: 'credit' },
  { id: 'gift', label: 'هدیه', color: '#E0609B', emoji: '🎁', kind: 'credit' },
  { id: 'refund', label: 'عودت وجه', color: '#9B6EF3', emoji: '↩️', kind: 'credit' },
  { id: INCOME_FALLBACK_ID, label: 'سایر درآمد', color: '#8FA9AF', emoji: '📥', kind: 'credit' },
];

export const BUILT_IN_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** رنگ‌های پیشنهادی برای دسته‌ی دلخواه. */
export const CATEGORY_COLOR_CHOICES = [
  '#F5821F',
  '#16B86A',
  '#3B6FE0',
  '#8B5CF6',
  '#DB4E8C',
  '#00C2CB',
  '#FFC52E',
  '#E5484D',
  '#0E9F6E',
  '#64818A',
];

/** ایموجی‌های پیشنهادی برای دسته‌ی دلخواه. */
export const CATEGORY_EMOJI_CHOICES = [
  '🏠', '🎓', '🐈', '🎁', '✈️', '⛽', '💪', '📚',
  '💇', '🧹', '👶', '🎵', '🔧', '☕', '🌱', '💼',
];

/**
 * پیدا کردن دسته از روی شناسه.
 *
 * `kind` تعیین می‌کند وقتی دسته پیدا نشد کدام دسته‌ی پیش‌فرض برگردد — تراکنش
 * درآمدی که دسته‌اش حذف شده باید «سایر درآمد» بگیرد نه «متفرقه»ی خرج.
 */
export function resolveCategory(
  categories: Category[],
  id: CategoryId,
  kind: TransactionType = 'debit',
): Category {
  const found = categories.find(category => category.id === id);
  if (found) return found;

  const fallbackId = fallbackIdFor(kind);
  return (
    categories.find(category => category.id === fallbackId) ??
    BUILT_IN_CATEGORIES.find(category => category.id === fallbackId) ??
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  );
}
