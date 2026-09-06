import { BuiltInCategoryId, Category, CategoryId } from '../types';

/** دسته‌ای که وقتی چیزی پیدا نشد یا دسته‌ای حذف شد، جایگزین می‌شود. */
export const FALLBACK_CATEGORY_ID: BuiltInCategoryId = 'other';

export const BUILT_IN_CATEGORIES: Category[] = [
  { id: 'food', label: 'رستوران و کافه', color: '#F97316', emoji: '🍔' },
  { id: 'grocery', label: 'خواربار و سوپرمارکت', color: '#12A150', emoji: '🛒' },
  { id: 'transport', label: 'حمل و نقل', color: '#2E6BE6', emoji: '🚕' },
  { id: 'bills', label: 'قبوض و شارژ', color: '#8B5CF6', emoji: '🧾' },
  { id: 'shopping', label: 'خرید و پوشاک', color: '#EC4899', emoji: '🛍️' },
  { id: 'health', label: 'سلامت و دارو', color: '#06B6D4', emoji: '💊' },
  { id: 'entertainment', label: 'سرگرمی', color: '#EAB308', emoji: '🎬' },
  { id: 'transfer', label: 'انتقال وجه', color: '#64748B', emoji: '🔁' },
  { id: FALLBACK_CATEGORY_ID, label: 'متفرقه', color: '#94A3B8', emoji: '📦' },
];

/** رنگ‌های پیشنهادی برای دسته‌ی دلخواه. */
export const CATEGORY_COLOR_CHOICES = [
  '#F97316',
  '#12A150',
  '#2E6BE6',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#EAB308',
  '#EF4444',
  '#14B8A6',
  '#64748B',
];

/** ایموجی‌های پیشنهادی برای دسته‌ی دلخواه. */
export const CATEGORY_EMOJI_CHOICES = [
  '🏠', '🎓', '🐈', '🎁', '✈️', '⛽', '💪', '📚',
  '💇', '🧹', '👶', '🎵', '🔧', '☕', '🌱', '💼',
];

/**
 * پیدا کردن دسته از روی شناسه. اگر دسته حذف شده باشد «متفرقه» برمی‌گردد،
 * پس تراکنش‌های قدیمی هرگز بدون دسته نمی‌مانند.
 */
export function resolveCategory(categories: Category[], id: CategoryId): Category {
  return (
    categories.find(category => category.id === id) ??
    categories.find(category => category.id === FALLBACK_CATEGORY_ID) ??
    BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1]
  );
}
