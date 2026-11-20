import { buildInstallmentReminders } from '../src/services/installmentReminders';
import { Installment } from '../src/types';

const due = new Date(2026, 10, 20);
const plan: Installment = { id: 'purchase', title: 'موبایل', counterparty: 'دیجی‌کالا', kind: 'purchase', amount: 3_000_000, count: 2, paid: [], firstDueDate: due.toISOString(), reminderEnabled: true };

test('یادآوری روز قبل ساعت ۹، با عنوان خرید و فروشگاه', () => {
  const reminders = buildInstallmentReminders([plan], new Date(2026, 10, 18));
  expect(reminders).toHaveLength(2);
  expect(reminders[0]).toMatchObject({ title: 'موبایل · دیجی‌کالا', amount: 3_000_000, number: 1, triggerAt: new Date(2026, 10, 19, 9).getTime() });
});

test('پس از گذشت زمان روز قبل، در روز سررسید یادآوری می‌کند', () => {
  expect(buildInstallmentReminders([plan], new Date(2026, 10, 19, 15))[0].triggerAt).toBe(new Date(2026, 10, 20, 9).getTime());
});

test('موعد گذشته و قسط پرداخت‌شده یا یادآوری خاموش، زمان‌بندی نمی‌شوند', () => {
  expect(buildInstallmentReminders([{ ...plan, count: 1 }], new Date(2026, 10, 20, 10))).toEqual([]);
  expect(buildInstallmentReminders([{ ...plan, paid: [1, 2] }], new Date(2026, 10, 18))).toEqual([]);
  expect(buildInstallmentReminders([{ ...plan, reminderEnabled: false }], new Date(2026, 10, 18))).toEqual([]);
});

test('رکورد قدیمی بدون تنظیم یادآوری، خودکار اعلان نمی‌گیرد', () => {
  expect(buildInstallmentReminders([{ ...plan, reminderEnabled: undefined }], new Date(2026, 10, 18))).toEqual([]);
});
