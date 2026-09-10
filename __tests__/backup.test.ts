import { buildBackup, parseBackup } from '../src/services/backup';
import { Transaction } from '../src/types';

const tx: Transaction = {
  id: 'tx_1',
  amount: 119000,
  merchant: 'اسنپ‌فود',
  categoryId: 'food',
  date: '2026-09-08T08:32:00.000Z',
  type: 'debit',
  rawSms: 'بانک رفاه حساب419675840 خرید1,190,000- مانده4,621,300',
};

describe('backup', () => {
  it('متن خام پیامک را از خروجی حذف می‌کند', () => {
    const file = JSON.parse(
      buildBackup({ transactions: [tx], customCategories: [], monthlyBudget: null }),
    );

    expect(file.transactions[0]).not.toHaveProperty('rawSms');
    expect(file.transactions[0].amount).toBe(119000);
  });

  it('بودجه را ذخیره و برمی‌گرداند', () => {
    const json = buildBackup({
      transactions: [tx],
      customCategories: [],
      monthlyBudget: 3_000_000,
    });

    const result = parseBackup(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contents.monthlyBudget).toBe(3_000_000);
  });

  it('فایل نسخه‌ی ۱ که بودجه ندارد هنوز خوانده می‌شود', () => {
    const old = JSON.stringify({
      app: 'polbin',
      version: 1,
      exportedAt: '2026-09-08T00:00:00.000Z',
      transactions: [{ ...tx, rawSms: undefined }],
      customCategories: [],
    });

    const result = parseBackup(old);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contents.transactions).toHaveLength(1);
      expect(result.contents.monthlyBudget).toBeNull();
    }
  });

  it('فایل نسخه‌ی جدیدتر را رد می‌کند', () => {
    const future = JSON.stringify({
      app: 'polbin',
      version: 99,
      exportedAt: '2026-09-08T00:00:00.000Z',
      transactions: [tx],
      customCategories: [],
    });

    expect(parseBackup(future).ok).toBe(false);
  });

  it('فایل غیرمرتبط را رد می‌کند', () => {
    expect(parseBackup('{"app":"something-else","version":1}').ok).toBe(false);
    expect(parseBackup('not json at all').ok).toBe(false);
  });
});
