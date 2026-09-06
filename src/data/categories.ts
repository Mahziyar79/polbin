import { Category, CategoryId } from '../types';

export const CATEGORIES: Record<CategoryId, Category> = {
  food: { id: 'food', label: 'رستوران و کافه', color: '#F97316', emoji: '🍔' },
  grocery: { id: 'grocery', label: 'خواربار و سوپرمارکت', color: '#12A150', emoji: '🛒' },
  transport: { id: 'transport', label: 'حمل و نقل', color: '#2E6BE6', emoji: '🚕' },
  bills: { id: 'bills', label: 'قبوض و شارژ', color: '#8B5CF6', emoji: '🧾' },
  shopping: { id: 'shopping', label: 'خرید و پوشاک', color: '#EC4899', emoji: '🛍️' },
  health: { id: 'health', label: 'سلامت و دارو', color: '#06B6D4', emoji: '💊' },
  entertainment: { id: 'entertainment', label: 'سرگرمی', color: '#EAB308', emoji: '🎬' },
  transfer: { id: 'transfer', label: 'انتقال وجه', color: '#64748B', emoji: '🔁' },
  other: { id: 'other', label: 'متفرقه', color: '#94A3B8', emoji: '📦' },
};

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES);

export function getCategory(id: CategoryId): Category {
  return CATEGORIES[id] ?? CATEGORIES.other;
}
