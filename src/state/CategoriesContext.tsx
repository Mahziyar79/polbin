import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { BUILT_IN_CATEGORIES, fallbackIdFor, resolveCategory } from '../data/categories';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { Category, CategoryId, TransactionType } from '../types';

export interface NewCategoryInput {
  label: string;
  emoji: string;
  color: string;
  kind: TransactionType;
}

interface CategoriesContextValue {
  categories: Category[];
  /** فقط دسته‌های خرج یا فقط دسته‌های درآمد. */
  categoriesOfKind: (kind: TransactionType) => Category[];
  /** دسته را از روی شناسه پیدا می‌کند؛ ناشناخته را به پیش‌فرضِ همان نوع می‌برد. */
  resolve: (id: CategoryId, kind?: TransactionType) => Category;
  /** خطای اعتبارسنجی برمی‌گرداند، یا null اگر ساخته شد. */
  addCategory: (input: NewCategoryInput) => string | null;
  /** فقط دسته‌های ساخته‌ی کاربر حذف می‌شوند. */
  deleteCategory: (id: CategoryId) => void;
  canDelete: (id: CategoryId) => boolean;
  /** جایگزینی کامل دسته‌های دلخواه — برای بازگردانی از فایل پشتیبان. */
  replaceCustom: (next: Category[]) => void;
  /** فقط دسته‌های ساخته‌ی کاربر، برای نوشتن در فایل پشتیبان. */
  customCategories: Category[];
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useState<Category[]>(() => {
    const stored = readJSON<Category[]>(STORAGE_KEYS.customCategories, []);

    // دسته‌های ذخیره‌شده پیش از افزودن درآمد فیلد `kind` ندارند. بدون این
    // مهاجرت، `categoriesOfKind` هیچ‌وقت برشان نمی‌گرداند و دسته‌های دلخواه
    // کاربر بی‌صدا ناپدید می‌شوند. آن موقع فقط خرج وجود داشت، پس debit درست است.
    return stored.map(category => (category.kind ? category : { ...category, kind: 'debit' }));
  });

  /** هر تغییر در دسته‌های دلخواه بلافاصله روی گوشی نوشته می‌شود. */
  const persist = useCallback((next: Category[]) => {
    writeJSON(STORAGE_KEYS.customCategories, next);
    setCustom(next);
  }, []);

  const categories = useMemo(() => [...BUILT_IN_CATEGORIES, ...custom], [custom]);

  const resolve = useCallback(
    (id: CategoryId, kind: TransactionType = 'debit') => resolveCategory(categories, id, kind),
    [categories],
  );

  const categoriesOfKind = useCallback(
    (kind: TransactionType) => categories.filter(category => category.kind === kind),
    [categories],
  );

  const addCategory = useCallback(
    (input: NewCategoryInput): string | null => {
      const label = input.label.trim();
      if (label.length === 0) return 'نام دسته را بنویس.';
      if (label.length > 30) return 'نام دسته خیلی بلند است.';
      if (categories.some(category => category.kind === input.kind && category.label === label)) {
        return 'دسته‌ای با همین نام از قبل وجود دارد.';
      }

      persist([
        ...custom,
        {
          id: `custom_${Date.now()}`,
          label,
          emoji: input.emoji,
          color: input.color,
          kind: input.kind,
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
      if (id === fallbackIdFor('debit') || id === fallbackIdFor('credit')) return;
      persist(custom.filter(category => category.id !== id));
    },
    [custom, persist],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      categoriesOfKind,
      resolve,
      addCategory,
      deleteCategory,
      canDelete,
      replaceCustom: persist,
      customCategories: custom,
    }),
    [categories, categoriesOfKind, resolve, addCategory, deleteCategory, canDelete, persist, custom],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories باید داخل CategoriesProvider استفاده شود.');
  return ctx;
}
