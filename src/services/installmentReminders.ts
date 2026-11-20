import { NativeModules } from 'react-native';
import { Installment } from '../types';
import { expand } from './installments';

export interface InstallmentReminder {
  key: string;
  title: string;
  amount: number;
  number: number;
  kind?: Installment['kind'];
  dueAt: number;
  triggerAt: number;
}

export function buildInstallmentReminders(plans: Installment[], now = new Date()): InstallmentReminder[] {
  return plans.filter(plan => plan.reminderEnabled).flatMap(plan => expand(plan, now)
    .filter(item => !item.paid)
    .flatMap(item => {
      const due = new Date(item.dueDate);
      due.setHours(9, 0, 0, 0);
      const trigger = new Date(due);
      trigger.setDate(trigger.getDate() - 1);
      // If the day-before reminder has passed, still remind on the due date.
      if (trigger.getTime() <= now.getTime()) trigger.setTime(due.getTime());
      if (trigger.getTime() <= now.getTime()) return [];
      return [{ key: `${plan.id}:${item.number}:${item.dueDate.getTime()}`, title: [plan.title, plan.counterparty].filter(Boolean).join(' · '), amount: plan.amount, number: item.number, kind: plan.kind, dueAt: due.getTime(), triggerAt: trigger.getTime() }];
    }));
}

export async function syncInstallmentReminders(plans: Installment[]): Promise<void> {
  const native = NativeModules.PolbinInstallmentReminders;
  if (native) await native.replace(JSON.stringify(buildInstallmentReminders(plans)));
}
