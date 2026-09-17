import { findBalanceGaps, MIN_GAP_TOMAN } from '../src/services/gaps';
import { Transaction } from '../src/types';

let counter = 0;

function sms(over: Partial<Transaction>): Transaction {
  counter += 1;
  return {
    id: `tx_${counter}`,
    amount: 100_000,
    merchant: 'x',
    categoryId: 'other',
    date: '2026-09-10T08:00:00.000Z',
    type: 'debit',
    bank: 'بانک ملت',
    cardLast4: '1234',
    rawSms: 'sms',
    ...over,
  };
}

function manual(over: Partial<Transaction>): Transaction {
  const base = sms(over);
  delete base.rawSms;
  delete base.cardLast4;
  delete base.balance;
  return base;
}

describe('findBalanceGaps', () => {
  it('وقتی مانده‌ها با مبلغ‌ها می‌خوانند، اختلافی نیست', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-11T08:00:00.000Z', amount: 50_000, balance: 850_000 }),
      sms({ date: '2026-09-12T08:00:00.000Z', amount: 200_000, type: 'credit', balance: 1_050_000 }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('پولی که بین دو پیامک بی‌خبر رفته را با مبلغ و بازه پیدا می‌کند', () => {
    const a = sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 });
    const b = sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 });

    const gaps = findBalanceGaps([a, b]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      amount: 45_000,
      type: 'debit',
      bank: 'بانک ملت',
      cardLast4: '1234',
      from: a.date,
      to: b.date,
    });
  });

  it('پولی که بی‌خبر آمده، از نوع درآمد است', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-11T08:00:00.000Z', amount: 50_000, balance: 1_350_000 }),
    ];
    expect(findBalanceGaps(list)[0]).toMatchObject({ amount: 500_000, type: 'credit' });
  });

  it('تراکنش دستیِ همان بانک در همان بازه، اختلاف را می‌بندد', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      manual({ date: '2026-09-11T12:00:00.000Z', amount: 45_000 }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('تراکنش دستی با تاریخ دقیقاً روی پیامک دوم هم حساب می‌شود', () => {
    // فرم «ثبت» تاریخ را همان لحظه‌ی پیامک دوم می‌گذارد؛ باید اختلاف را ببندد.
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      manual({ date: '2026-09-12T09:30:00.000Z', amount: 45_000 }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('تراکنش دستیِ بانک دیگر، اختلاف را نمی‌بندد', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      manual({ date: '2026-09-11T12:00:00.000Z', amount: 45_000, bank: 'بانک ملی' }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    expect(findBalanceGaps(list)).toHaveLength(1);
  });

  it('پیامکِ همین کارت که مانده‌اش خوانده نشده، اختلاف را می‌بندد', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-11T12:00:00.000Z', amount: 45_000 }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('کارت‌های مختلف زنجیره‌ی جدا دارند', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000, cardLast4: '1234' }),
      sms({ date: '2026-09-11T08:00:00.000Z', amount: 10_000, balance: 5_000_000, cardLast4: '9999' }),
      sms({ date: '2026-09-12T08:00:00.000Z', amount: 50_000, balance: 850_000, cardLast4: '1234' }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('اختلاف کمتر از حد، گِرد شدن است نه تراکنش', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-11T08:00:00.000Z', amount: 50_000, balance: 850_000 - (MIN_GAP_TOMAN - 1) }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('پیامکی که دو بار ثبت شده اختلاف نمی‌سازد', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-10T08:00:05.000Z', amount: 100_000, balance: 900_000 }),
    ];
    expect(findBalanceGaps(list)).toEqual([]);
  });

  it('اختلافی که کاربر نادیده گرفته برنمی‌گردد', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    const [gap] = findBalanceGaps(list);
    expect(findBalanceGaps(list, new Set([gap.id]))).toEqual([]);
  });

  it('ترتیب ورودی مهم نیست و تازه‌ترین اختلاف اول می‌آید', () => {
    const list = [
      sms({ date: '2026-09-14T08:00:00.000Z', amount: 10_000, balance: 700_000 }),
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-12T08:00:00.000Z', amount: 50_000, balance: 800_000 }),
    ];
    const gaps = findBalanceGaps(list);
    expect(gaps.map(gap => gap.amount)).toEqual([90_000, 50_000]);
  });

  it('اختلاف قدیمی‌تر از دو ماه نشان داده نمی‌شود', () => {
    const list = [
      sms({ date: '2026-09-10T08:00:00.000Z', amount: 100_000, balance: 900_000 }),
      sms({ date: '2026-09-12T09:30:00.000Z', amount: 50_000, balance: 805_000 }),
    ];
    expect(findBalanceGaps(list, new Set(), new Date('2026-10-01T00:00:00.000Z'))).toHaveLength(1);
    expect(findBalanceGaps(list, new Set(), new Date('2026-12-01T00:00:00.000Z'))).toEqual([]);
  });

  it('تراکنش‌های بدون مانده به‌تنهایی هیچ اختلافی نمی‌سازند', () => {
    expect(findBalanceGaps([manual({}), manual({}), sms({})])).toEqual([]);
  });
});
