import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { BUILT_IN_CATEGORIES, FALLBACK_CATEGORY_ID, resolveCategory } from '../data/categories';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { Category, CategoryId } from '../types';

export interface NewCategoryInput {
  label: string;
  emoji: string;
  color: string;
}

interface CategoriesContextValue {
  categories: Category[];
  /** دسته را از روی شناسه پیدا می‌کند؛ برای شناسه‌ی ناشناخته «متفرقه» می‌دهد. */
  resolve: (id: CategoryId) => Category;
  /** خطای اعتبارسنجی برمی‌گرداند، یا null اگر ساخته شد. */
  addCategory: (input: NewCategoryInput) => string | null;
  /** فقط دسته‌های ساخته‌ی کاربر حذف می‌شوند. */
  deleteCategory: (id: CategoryId) => void;
  canDelete: (id: CategoryId) => boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useState<Category[]>(() =>
    readJSON<Category[]>(STORAGE_KEYS.customCategories, []),
  );

  /** هر تغییر در دسته‌های دلخواه بلافاصله روی گوشی نوشته می‌شود. */
  const persist = useCallback((next: Category[]) => {
    writeJSON(STORAGE_KEYS.customCategories, next);
    setCustom(next);
  }, []);

  const categories = useMemo(() => [...BUILT_IN_CATEGORIES, ...custom], [custom]);

  const resolve = useCallback((id: CategoryId) => resolveCategory(categories, id), [categories]);

  const addCategory = useCallback(
    (input: NewCategoryInput): string | null => {
      const label = input.label.trim();
      if (label.length === 0) return 'نام دسته را بنویس.';
      if (label.length > 30) return 'نام دسته خیلی بلند است.';
      if (categories.some(category => category.label === label)) {
        return 'دسته‌ای با همین نام از قبل وجود دارد.';
      }

      persist([
        ...custom,
        {
          id: `custom_${Date.now()}`,
          label,
          emoji: input.emoji,
          color: input.color,
          isCustom: true,
        },
      ]);
      return null;
    },
    [categories, custom, persist],
  );

  const canDelete = useCallback(
    (id: CategoryId) => custom.some(category => category.id === id),
    [custom],
  );

  const deleteCategory = useCallback(
    (id: CategoryId) => {
      if (id === FALLBACK_CATEGORY_ID) return;
      persist(custom.filter(category => category.id !== id));
    },
    [custom, persist],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({ categories, resolve, addCategory, deleteCategory, canDelete }),
    [categories, resolve, addCategory, deleteCategory, canDelete],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories باید داخل CategoriesProvider استفاده شود.');
  return ctx;
}
