import React, { createContext, useContext, useMemo, useState } from 'react';
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from '../services/storage';

interface Budget {
  /** سقف خرج ماهانه به تومان. */
  monthly: number;
}

interface BudgetContextValue {
  /** null یعنی کاربر هنوز سقفی نگذاشته. */
  monthly: number | null;
  setMonthly: (amount: number) => void;
  clear: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

/**
 * سقف خرج ماهانه.
 *
 * عمداً یک عدد ساده است نه سقف به تفکیک دسته: کاربری که تازه شروع کرده هنوز
 * نمی‌داند ماهی چقدر خرج غذا می‌کند، پس از او خواستن که برای ده دسته عدد
 * بگذارد یعنی رها کردن صفحه. سقف کلی همان روز اول قابل جواب دادن است.
 */
export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budget, setBudget] = useState<Budget | null>(() =>
    readJSON<Budget | null>(STORAGE_KEYS.budget, null),
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      monthly: budget && budget.monthly > 0 ? budget.monthly : null,
      setMonthly: (amount: number) => {
        const next: Budget = { monthly: amount };
        writeJSON(STORAGE_KEYS.budget, next);
        setBudget(next);
      },
      clear: () => {
        removeKey(STORAGE_KEYS.budget);
        setBudget(null);
      },
    }),
    [budget],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget باید داخل BudgetProvider استفاده شود.');
  return ctx;
}
