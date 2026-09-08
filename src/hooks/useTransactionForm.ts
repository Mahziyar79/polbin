import { useCallback, useState } from 'react';
import { fallbackIdFor } from '../data/categories';
import { CategoryId, TransactionType } from '../types';
import { formatToman, toEnDigits } from '../utils/format';

/** فقط رقم‌ها را نگه می‌دارد و به شکل فارسیِ گروه‌بندی‌شده برمی‌گرداند. */
export function normalizeAmountInput(text: string): string {
  const digits = toEnDigits(text).replace(/[^\d]/g, '');
  return digits ? formatToman(Number(digits), false) : '';
}

export interface TransactionFormValues {
  amount: number | null;
  merchant: string | null;
  categoryId: CategoryId;
  type: TransactionType;
}

export interface TransactionForm {
  amountText: string;
  setAmountText: (text: string) => void;
  merchant: string;
  setMerchant: (value: string) => void;
  categoryId: CategoryId;
  setCategoryId: (id: CategoryId) => void;
  /** خرج یا درآمد. */
  type: TransactionType;
  setType: (type: TransactionType) => void;
  /** مبلغ عددی به تومان، برگرفته از متن ورودی. */
  amount: number;
  canSave: boolean;
  /** پر کردن فرم از بیرون — مثلاً بعد از رسیدن نتیجه‌ی پارس پیامک. */
  setValues: (values: Partial<TransactionFormValues>) => void;
}

/**
 * حالت مشترک فرم تراکنش. هم صفحه‌ی تایید پیامک و هم صفحه‌ی افزودن دستی
 * از همین hook استفاده می‌کنند تا منطق مبلغ و اعتبارسنجی یک‌جا بماند.
 */
export function useTransactionForm(initial?: Partial<TransactionFormValues>): TransactionForm {
  const [amountText, setAmountTextRaw] = useState(
    initial?.amount ? formatToman(initial.amount, false) : '',
  );
  const [merchant, setMerchant] = useState(initial?.merchant ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(initial?.categoryId ?? 'other');
  const [type, setTypeRaw] = useState<TransactionType>(initial?.type ?? 'debit');

  /**
   * با عوض شدن نوع، دسته هم باید عوض شود؛ وگرنه یک تراکنش درآمدی با دسته‌ی
   * «رستوران و کافه» ذخیره می‌شد که در هیچ نموداری درست نمی‌نشیند.
   */
  const setType = useCallback((next: TransactionType) => {
    setTypeRaw(next);
    setCategoryId(fallbackIdFor(next));
  }, []);

  const setAmountText = useCallback((text: string) => {
    setAmountTextRaw(normalizeAmountInput(text));
  }, []);

  const setValues = useCallback((values: Partial<TransactionFormValues>) => {
    if (values.amount !== undefined) {
      setAmountTextRaw(values.amount ? formatToman(values.amount, false) : '');
    }
    if (values.merchant !== undefined) setMerchant(values.merchant ?? '');
    if (values.categoryId !== undefined) setCategoryId(values.categoryId);
    if (values.type !== undefined) setTypeRaw(values.type);
  }, []);

  const amount = Number(toEnDigits(amountText).replace(/[^\d]/g, '')) || 0;

  return {
    amountText,
    setAmountText,
    merchant,
    setMerchant,
    categoryId,
    setCategoryId,
    type,
    setType,
    amount,
    canSave: amount > 0 && merchant.trim().length > 0,
    setValues,
  };
}
