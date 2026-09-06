import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createTransaction, fetchTransactions, FAKE_SMS_COUNT, getFakeSms } from '../services/fakeApi';
import { Transaction } from '../types';

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  /** پیام خطای بارگذاری؛ وقتی null است یعنی مشکلی نبوده. */
  error: string | null;
  /** آخرین تراکنشی که کاربر تایید کرده — برای هایلایت در داشبورد. */
  lastAddedId: string | null;
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<Transaction>;
  /** تلاش دوباره برای گرفتن لیست تراکنش‌ها. */
  reload: () => void;
  /** پیامک بعدی از صف نمونه؛ جای Share Intent واقعی را می‌گیرد. */
  takeNextFakeSms: () => string;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [smsCursor, setSmsCursor] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchTransactions()
      .then(data => {
        if (mounted) setTransactions(data);
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
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken(prev => prev + 1), []);

  const addTransaction = useCallback(async (input: Omit<Transaction, 'id'>) => {
    const created = await createTransaction(input);
    setTransactions(prev => [created, ...prev]);
    setLastAddedId(created.id);
    return created;
  }, []);

  const takeNextFakeSms = useCallback(() => {
    const sms = getFakeSms(smsCursor);
    setSmsCursor(prev => (prev + 1) % FAKE_SMS_COUNT);
    return sms;
  }, [smsCursor]);

  const value = useMemo<TransactionsContextValue>(
    () => ({ transactions, loading, error, lastAddedId, addTransaction, reload, takeNextFakeSms }),
    [transactions, loading, error, lastAddedId, addTransaction, reload, takeNextFakeSms],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions باید داخل TransactionsProvider استفاده شود.');
  return ctx;
}
