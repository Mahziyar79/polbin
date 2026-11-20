import { InstallmentKind } from '../types';

export const INSTALLMENT_KINDS: { id: InstallmentKind; label: string; emoji: string }[] = [
  { id: 'purchase', label: 'خرید قسطی', emoji: '🛍️' },
  { id: 'loan', label: 'وام', emoji: '🏦' },
  { id: 'cheque', label: 'چک', emoji: '🧾' },
];

export function installmentKindLabel(kind?: InstallmentKind): string {
  return INSTALLMENT_KINDS.find(item => item.id === kind)?.label ?? 'اقساط';
}
