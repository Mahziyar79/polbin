import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createTransaction, fetchTransactions } from '../services/fakeApi';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { CategoryId, Transaction } from '../types';

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  /** پیام خطای بارگذاری؛ وقتی null است یعنی مشکلی نبوده. */
  error: string | null;
  /** آخرین تراکنشی که کاربر تایید کرده — برای هایلایت در داشبورد. */
  lastAddedId: string | null;
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<Transaction>;
  /** حذف یک تراکنش. برگشت‌ناپذیر است، پس صدا زدنش باید تایید گرفته باشد. */
  removeTransaction: (id: string) => void;
  /** تراکنش‌های یک دسته را به دسته‌ی دیگر منتقل می‌کند — موقع حذف دسته. */
  reassignCategory: (fromId: CategoryId, toId: CategoryId) => void;
  /** گرفتن دوباره از سرور و بازنویسی کش محلی. */
  reload: () => void;
  /** جایگزینی کامل لیست — برای بازگردانی از فایل پشتیبان. */
  replaceAll: (next: Transaction[]) => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  // اگر چیزی از قبل ذخیره شده باشد همان لحظه‌ی اول در دسترس است،
  // پس فقط وقتی «در حال بارگذاری» نشان می‌دهیم که کش خالی باشد.
  const cached = useMemo(
    () => readJSON<Transaction[] | null>(STORAGE_KEYS.transactions, null),
    [],
  );

  const [transactions, setTransactions] = useState<Transaction[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // با کش موجود سراغ سرور نمی‌رویم؛ فقط «تلاش دوباره» صریح این را دور می‌زند.
    if (cached !== null && reloadToken === 0) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchTransactions()
      .then(data => {
        if (!mounted) return;
        writeJSON(STORAGE_KEYS.transactions, data);
        setTransactions(data);
      })
      .catch(() => {
        if (mounted) setError('گرفتن تراکنش‌ها ناموفق بود. اتصالت را بررسی کن.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [cached, reloadToken]);

  const reload = useCallback(() => setReloadToken(prev => prev + 1), []);

  const replaceAll = useCallback((next: Transaction[]) => {
    writeJSON(STORAGE_KEYS.transactions, next);
    setTransactions(next);
  }, []);

  const addTransaction = useCallback(
    async (input: Omit<Transaction, 'id'>) => {
      const created = await createTransaction(input);
      setTransactions(prev => {
        const next = [created, ...prev];
        writeJSON(STORAGE_KEYS.transactions, next);
        return next;
      });
      setLastAddedId(created.id);
      return created;
    },
    [],
  );

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const next = prev.filter(tx => tx.id !== id);
      writeJSON(STORAGE_KEYS.transactions, next);
      return next;
    });
    // اگر همین تراکنش هایلایت بود، هایلایتِ یک ردیفِ حذف‌شده باقی نماند.
    setLastAddedId(prev => (prev === id ? null : prev));
  }, []);

  const reassignCategory = useCallback((fromId: CategoryId, toId: CategoryId) => {
    setTransactions(prev => {
      const next = prev.map(tx => (tx.categoryId === fromId ? { ...tx, categoryId: toId } : tx));
      writeJSON(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      loading,
      error,
      lastAddedId,
      addTransaction,
      removeTransaction,
      reassignCategory,
      reload,
      replaceAll,
    }),
    [
      transactions,
      loading,
      error,
      lastAddedId,
      addTransaction,
      removeTransaction,
      reassignCategory,
      reload,
      replaceAll,
    ],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions باید داخل TransactionsProvider استفاده شود.');
  return ctx;
}
