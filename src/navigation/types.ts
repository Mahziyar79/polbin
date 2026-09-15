export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  ConfirmTransaction: { rawSms: string };
  AddTransaction: undefined;
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
