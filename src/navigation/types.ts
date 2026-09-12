export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  ConfirmTransaction: { rawSms: string };
  AddTransaction: undefined;
  EditTransaction: { id: string };
  Transactions: undefined;
  About: undefined;
  Budget: undefined;
  Categories: undefined;
  Calendar: undefined;
  Installments: undefined;
  AddInstallment: { id?: string };
  Backup: undefined;
  LockSettings: undefined;
};
