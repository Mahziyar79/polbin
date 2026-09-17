import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createTransaction } from '../services/fakeApi';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { CategoryId, Transaction } from '../types';

interface TransactionsContextValue {
  transactions: Transaction[];
  /** آخرین تراکنشی که کاربر تایید کرده — برای هایلایت در داشبورد. */
  lastAddedId: string | null;
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<Transaction>;
  /** ویرایش فیلدهای یک تراکنش. شناسه و تاریخ دست‌نخورده می‌مانند. */
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
  /** حذف یک تراکنش. برگشت‌ناپذیر است، پس صدا زدنش باید تایید گرفته باشد. */
  removeTransaction: (id: string) => void;
  /** تراکنش‌های یک دسته را به دسته‌ی دیگر منتقل می‌کند — موقع حذف دسته. */
  reassignCategory: (fromId: CategoryId, toId: CategoryId) => void;
  /** جایگزینی کامل لیست — برای بازگردانی از فایل پشتیبان. */
  replaceAll: (next: Transaction[]) => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  // خواندن از حافظه همگام است؛ هیچ حالت «در حال بارگذاری» لازم نیست.
  //
  // قبلاً یک «سرور جعلی» هم بود که در اولین اجرا لیست خالی برمی‌گرداند و دکمه‌ی
  // «تلاش دوباره» همان لیست خالی را روی داده‌ی واقعی کاربر می‌نوشت. اپ سرور
  // ندارد؛ این لایه حذف شد.
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readJSON<Transaction[]>(STORAGE_KEYS.transactions, []),
  );
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

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

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Omit<Transaction, 'id'>>) => {
      setTransactions(prev => {
        const next = prev.map(tx => (tx.id === id ? { ...tx, ...patch } : tx));
        writeJSON(STORAGE_KEYS.transactions, next);
        return next;
      });
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
      lastAddedId,
      addTransaction,
      updateTransaction,
      removeTransaction,
      reassignCategory,
      replaceAll,
    }),
    [
      transactions,
      lastAddedId,
      addTransaction,
      updateTransaction,
      removeTransaction,
      reassignCategory,
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
