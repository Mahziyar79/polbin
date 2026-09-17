export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  ConfirmTransaction: { rawSms: string };
  /** پیش‌پرشده از کارت «پولی بی‌خبر رفته»؛ بدون پارامتر یعنی فرم خالی. */
  AddTransaction:
    | {
        prefill?: {
          amount: number;
          type: 'debit' | 'credit';
          bank: string | null;
          /** ISO */
          date: string;
          merchant: string;
        };
      }
    | undefined;
  EditTransaction: { id: string };
  /** از داشبورد با لمس یک دسته می‌آید؛ فیلتر اولیه‌ی صفحه است. */
  Transactions: { categoryId?: string; type?: 'debit' | 'credit' } | undefined;
  About: undefined;
  Budget: undefined;
  Categories: undefined;
  Calendar: undefined;
  Installments: undefined;
  AddInstallment: { id?: string };
  Backup: undefined;
  LockSettings: undefined;
};
