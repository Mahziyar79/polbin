import { accountKey, accountLabel, latestBalances, totalBalance } from '../src/services/balances';
import { parseSms } from '../src/services/smsParser';
import { Transaction } from '../src/types';

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    amount: 100_000,
    merchant: 'x',
    categoryId: 'other',
    date: '2026-09-10T08:00:00.000Z',
    type: 'debit',
    ...over,
  };
}

describe('پارسر: مانده و شماره‌ی حساب', () => {
  it('مانده‌ی ریالی را به تومان می‌خواند', () => {
    const result = parseSms('بانک رفاه\nحساب419675840\nخرید1,190,000-\nمانده4,621,300');
    expect(result.balance).toBe(462_130);
    expect(result.accountLast4).toBe('5840');
    expect(result.amount).toBe(119_000);
  });

  it('«موجودی» با واحد تومان همان‌طور می‌ماند', () => {
    const result = parseSms('خرید 50,000 تومان از کارت ****1234 موجودی: 1,200,000 تومان');
    expect(result.balance).toBe(1_200_000);
    expect(result.cardLast4).toBe('1234');
    expect(result.accountLast4).toBeNull();
  });

  it('پیامک بدون مانده، مانده ندارد', () => {
    expect(parseSms('خرید 50,000 ریال از کارت ****1234').balance).toBeNull();
  });
});

describe('کلید حساب', () => {
  it('کارت بر حساب مقدم است و بانک جزو کلید است', () => {
    expect(accountKey({ bank: 'بانک رفاه', cardLast4: '1234', accountLast4: '5840' })).toBe('بانک رفاه/card/1234');
    expect(accountKey({ bank: 'بانک رفاه', accountLast4: '5840' })).toBe('بانک رفاه/account/5840');
    expect(accountKey({ bank: 'بانک رفاه' })).toBe('بانک رفاه/-');
  });

  it('همان کارت در دو بانک، دو حساب است', () => {
    expect(accountKey({ bank: 'بانک ملت', cardLast4: '1234' })).not.toBe(
      accountKey({ bank: 'بانک رفاه', cardLast4: '1234' }),
    );
  });
});

describe('آخرین مانده', () => {
  it('برای هر حساب، مانده‌ی تازه‌ترین پیامک را می‌دهد نه آخرین در فهرست', () => {
    const list = [
      tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 900_000, date: '2026-09-11T10:00:00.000Z' }),
      tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 500_000, date: '2026-09-09T10:00:00.000Z' }),
    ];

    const result = latestBalances(list);
    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe(900_000);
  });

  it('تراکنش‌های بدون مانده (دستی) نادیده گرفته می‌شوند', () => {
    const list = [
      tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 900_000 }),
      tx({ bank: 'بانک رفاه', cardLast4: '1234', date: '2026-09-12T10:00:00.000Z' }),
    ];

    expect(latestBalances(list)[0].balance).toBe(900_000);
  });

  it('چند حساب، تازه‌ترین اول', () => {
    const list = [
      tx({ bank: 'بانک ملت', cardLast4: '9999', balance: 1, date: '2026-09-01T10:00:00.000Z' }),
      tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 2, date: '2026-09-11T10:00:00.000Z' }),
    ];

    expect(latestBalances(list).map(a => a.cardLast4)).toEqual(['1234', '9999']);
  });

  it('مانده‌ی صفر معتبر است', () => {
    expect(latestBalances([tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 0 })])).toHaveLength(1);
  });

  it('برچسب و جمع', () => {
    const accounts = latestBalances([
      tx({ bank: 'بانک رفاه', cardLast4: '1234', balance: 100 }),
      tx({ bank: 'بانک ملت', accountLast4: '5840', balance: 50, date: '2026-09-01T00:00:00.000Z' }),
      tx({ bank: 'بلوبانک', balance: 7, date: '2026-08-01T00:00:00.000Z' }),
    ]);

    expect(accounts.map(accountLabel)).toEqual(['کارت ۱۲۳۴', 'حساب ۵۸۴۰', '']);
    expect(totalBalance(accounts)).toBe(157);
  });
});
