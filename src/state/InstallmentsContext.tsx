import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { syncInstallmentReminders } from '../services/installmentReminders';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { Installment } from '../types';

interface InstallmentsContextValue {
  installments: Installment[];
  reminderError: string | null;
  add: (input: Omit<Installment, 'id' | 'paid'> & { paid?: number[] }) => Installment;
  update: (id: string, patch: Partial<Omit<Installment, 'id'>>) => void;
  remove: (id: string) => void;
  /** علامت زدن یا برداشتن علامتِ یک قسط. */
  togglePaid: (id: string, number: number) => void;
  /** جایگزینی کامل — برای بازگردانی از فایل پشتیبان. */
  replaceAll: (next: Installment[]) => void;
}

const InstallmentsContext = createContext<InstallmentsContextValue | null>(null);

export function InstallmentsProvider({ children }: { children: React.ReactNode }) {
  const [installments, setInstallments] = useState<Installment[]>(() =>
    readJSON<Installment[]>(STORAGE_KEYS.installments, []),
  );
  const [reminderError, setReminderError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const sync = () => {
      syncInstallmentReminders(installments).then(() => {
        if (active) setReminderError(null);
      }).catch(() => {
        if (active) setReminderError('تنظیم یادآوری‌ها ناموفق بود؛ برنامه را دوباره باز کن.');
      });
    };
    sync();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    return () => { active = false; subscription.remove(); };
  }, [installments]);

  /** یک جا می‌نویسد تا حافظه و حالت هیچ‌وقت از هم جدا نیفتند. */
  const commit = useCallback((next: Installment[]) => {
    writeJSON(STORAGE_KEYS.installments, next);
    setInstallments(next);
    return next;
  }, []);

  const add = useCallback(
    (input: Omit<Installment, 'id' | 'paid'> & { paid?: number[] }) => {
      const paid = [...new Set(input.paid ?? [])]
        .filter(number => Number.isInteger(number) && number >= 1 && number <= input.count)
        .sort((a, b) => a - b);
      const created: Installment = { ...input, id: `ins_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, paid };
      setInstallments(current => {
        const next = [created, ...current];
        writeJSON(STORAGE_KEYS.installments, next);
        return next;
      });
      return created;
    },
    [],
  );

  const update = useCallback((id: string, patch: Partial<Omit<Installment, 'id'>>) => {
    setInstallments(current => {
      const next = current.map(item => (item.id === id ? { ...item, ...patch } : item));
      writeJSON(STORAGE_KEYS.installments, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setInstallments(current => {
      const next = current.filter(item => item.id !== id);
      writeJSON(STORAGE_KEYS.installments, next);
      return next;
    });
  }, []);

  const togglePaid = useCallback((id: string, number: number) => {
    setInstallments(current => {
      const next = current.map(item => {
        if (item.id !== id) return item;

        const paid = item.paid.includes(number)
          ? item.paid.filter(n => n !== number)
          : [...item.paid, number].sort((a, b) => a - b);

        return { ...item, paid };
      });

      writeJSON(STORAGE_KEYS.installments, next);
      return next;
    });
  }, []);

  const value = useMemo<InstallmentsContextValue>(
    () => ({ installments, reminderError, add, update, remove, togglePaid, replaceAll: commit }),
    [installments, reminderError, add, update, remove, togglePaid, commit],
  );

  return <InstallmentsContext.Provider value={value}>{children}</InstallmentsContext.Provider>;
}

export function useInstallments(): InstallmentsContextValue {
  const ctx = useContext(InstallmentsContext);
  if (!ctx) throw new Error('useInstallments باید داخل InstallmentsProvider استفاده شود.');
  return ctx;
}
