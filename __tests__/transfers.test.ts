import { balanceOf, buildBreakdown, totalIncome, totalSpend } from '../src/services/analytics';
import { BUILT_IN_CATEGORIES } from '../src/data/categories';
import {
  findTransferCounterpart,
  looksLikeTransferPair,
  TRANSFER_WINDOW_MS,
} from '../src/services/transfers';
import { Transaction } from '../src/types';

let counter = 0;

function tx(over: Partial<Transaction>): Transaction {
  counter += 1;
  return {
    id: `tx_${counter}`,
    amount: 500_000,
    merchant: 'انتقال وجه',
    categoryId: 'transfer',
    date: '2026-09-10T08:00:00.000Z',
    type: 'debit',
    bank: 'بانک ملت',
    cardLast4: '1234',
    rawSms: 'sms',
    ...over,
  };
}

const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 8, minutes)).toISOString();

describe('looksLikeTransferPair', () => {
  const out = tx({ type: 'debit', date: at(0) });

  it('برداشت از یک کارت و واریز هم‌مبلغ به کارت دیگر، چند دقیقه بعد', () => {
    expect(looksLikeTransferPair(out, tx({ type: 'credit', date: at(3), cardLast4: '9999' }))).toBe(true);
    expect(looksLikeTransferPair(out, tx({ type: 'credit', date: at(3), bank: 'بلوبانک', cardLast4: undefined }))).toBe(true);
  });

  it('همان کارت: برگشت وجه است، نه انتقال', () => {
    expect(looksLikeTransferPair(out, tx({ type: 'credit', date: at(3) }))).toBe(false);
  });

  it('نوع یکسان یا مبلغ متفاوت، جفت نیست', () => {
    expect(looksLikeTransferPair(out, tx({ type: 'debit', date: at(3), cardLast4: '9999' }))).toBe(false);
    expect(looksLikeTransferPair(out, tx({ type: 'credit', date: at(3), cardLast4: '9999', amount: 500_001 }))).toBe(false);
  });

  it('خارج از بازه‌ی زمانی جفت نیست', () => {
    const late = new Date(new Date(at(0)).getTime() + TRANSFER_WINDOW_MS + 1).toISOString();
    expect(looksLikeTransferPair(out, tx({ type: 'credit', date: late, cardLast4: '9999' }))).toBe(false);
  });
});

describe('findTransferCounterpart', () => {
  it('نزدیک‌ترین در زمان را برمی‌گرداند و خودش را کنار می‌گذارد', () => {
    const far = tx({ type: 'debit', date: at(-40), cardLast4: '9999' });
    const near = tx({ type: 'debit', date: at(-2), cardLast4: '9999' });
    const self = tx({ type: 'credit', date: at(0), id: 'me' });
    const found = findTransferCounterpart(self, [far, self, near], 'me');
    expect(found?.id).toBe(near.id);
  });

  it('وقتی چیزی نیست null', () => {
    expect(findTransferCounterpart(tx({ type: 'credit' }), [])).toBeNull();
  });
});

describe('انتقال داخلی در جمع‌ها نیست', () => {
  const list = [
    tx({ type: 'debit', amount: 500_000, internalTransfer: true }),
    tx({ type: 'credit', amount: 500_000, internalTransfer: true, cardLast4: '9999' }),
    tx({ type: 'debit', amount: 120_000, categoryId: 'food' }),
    tx({ type: 'credit', amount: 3_000_000, categoryId: 'salary' }),
  ];

  it('مجموع خرج، درآمد و مانده', () => {
    expect(totalSpend(list)).toBe(120_000);
    expect(totalIncome(list)).toBe(3_000_000);
    expect(balanceOf(list)).toBe(2_880_000);
  });

  it('تفکیک دسته', () => {
    const breakdown = buildBreakdown(list, BUILT_IN_CATEGORIES, 'debit');
    expect(breakdown.map(item => item.category.id)).toEqual(['food']);
  });
});
