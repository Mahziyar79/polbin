import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchPendingSms, PendingSms, removePendingSms, removePendingSmsBatch, subscribeToPendingSms } from '../services/pendingSms';
import { useTransactions } from './TransactionsContext';

interface PendingSmsContextValue {
  items: PendingSms[];
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<PendingSms[]>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
}

const Context = createContext<PendingSmsContextValue | null>(null);

export function PendingSmsProvider({ children }: { children: React.ReactNode }) {
  const { transactions } = useTransactions();
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const [items, setItems] = useState<PendingSms[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const ticket = ++request.current;
    try {
      const snapshot = await fetchPendingSms();
      const committed = new Set(transactionsRef.current.map(tx => tx.sourceSmsId).filter(Boolean));
      const remaining = snapshot.filter(item => !committed.has(item.id));
      // Recover a crash between the durable transaction write and removal from the queue.
      for (const item of snapshot) {
        if (committed.has(item.id)) await removePendingSms(item.id);
      }
      if (mounted.current && ticket === request.current) {
        setItems(remaining);
        setError(null);
        setLoaded(true);
      }
      return remaining;
    } catch {
      if (mounted.current && ticket === request.current) {
        setError('خواندن تراکنش‌های در انتظار ناموفق بود. دوباره تلاش کن.');
        setLoaded(true);
      }
      throw new Error('خواندن تراکنش‌های در انتظار ناموفق بود. دوباره تلاش کن.');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const reload = () => { refresh().catch(() => {}); };
    const unsubscribe = subscribeToPendingSms(reload);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') reload();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => { refresh().catch(() => {}); }, [transactions, refresh]);

  const dismiss = useCallback(async (id: string) => {
    await removePendingSms(id);
    await refresh();
  }, [refresh]);

  const dismissAll = useCallback(async () => {
    // Capture the confirmed list so a newly arriving SMS is not silently removed.
    await removePendingSmsBatch(items.map(item => item.id));
    await refresh();
  }, [items, refresh]);

  const value = useMemo(() => ({ items, loaded, error, refresh, dismiss, dismissAll }), [items, loaded, error, refresh, dismiss, dismissAll]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePendingSms(): PendingSmsContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('usePendingSms باید داخل PendingSmsProvider استفاده شود.');
  return value;
}
