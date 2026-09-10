import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { Installment } from '../types';

interface InstallmentsContextValue {
  installments: Installment[];
  add: (input: Omit<Installment, 'id' | 'paid'>) => Installment;
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

  /** یک جا می‌نویسد تا حافظه و حالت هیچ‌وقت از هم جدا نیفتند. */
  const commit = useCallback((next: Installment[]) => {
    writeJSON(STORAGE_KEYS.installments, next);
    setInstallments(next);
    return next;
  }, []);

  const add = useCallback(
    (input: Omit<Installment, 'id' | 'paid'>) => {
      const created: Installment = { ...input, id: `ins_${Date.now()}`, paid: [] };
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
    () => ({ installments, add, update, remove, togglePaid, replaceAll: commit }),
    [installments, add, update, remove, togglePaid, commit],
  );

  return <InstallmentsContext.Provider value={value}>{children}</InstallmentsContext.Provider>;
}

export function useInstallments(): InstallmentsContextValue {
  const ctx = useContext(InstallmentsContext);
  if (!ctx) throw new Error('useInstallments باید داخل InstallmentsProvider استفاده شود.');
  return ctx;
}
