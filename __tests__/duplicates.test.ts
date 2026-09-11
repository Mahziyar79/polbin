import { DuplicateCandidate, findDuplicate } from '../src/services/duplicates';
import { Transaction } from '../src/types';

const SMS = 'بانک رفاه حساب419675840 خرید1,190,000- مانده4,621,300 1404/06/18-12:30';

function at(hhmm: string, day = '2026-09-10'): string {
  return new Date(`${day}T${hhmm}:00`).toISOString();
}

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx_1',
    amount: 119_000,
    merchant: 'اسنپ‌فود',
    categoryId: 'food',
    date: at('12:30'),
    type: 'debit',
    bank: 'بانک رفاه',
    rawSms: SMS,
    ...over,
  };
}

function candidate(over: Partial<DuplicateCandidate> = {}): DuplicateCandidate {
  return { amount: 119_000, type: 'debit', date: at('12:30'), bank: 'بانک رفاه', rawSms: SMS, ...over };
}

describe('متن خام یکسان', () => {
  it('همان پیامک، حتی با ارقام فارسی و فاصله‌ی متفاوت', () => {
    const messy = SMS.replace('1,190,000', '۱٬۱۹۰٬۰۰۰').replace('خرید', 'خريد  ');
    const match = findDuplicate(candidate({ rawSms: messy }), [tx()]);

    expect(match?.reason).toBe('same-sms');
    expect(match?.existing.id).toBe('tx_1');
  });

  it('پیامک یکی است حتی اگر کاربر مبلغ را قبل از ثبت عوض کرده باشد', () => {
    const match = findDuplicate(candidate({ amount: 120_000 }), [tx()]);
    expect(match?.reason).toBe('same-sms');
  });

  it('وقتی یکی از دو طرف پیامک ندارد، متن مقایسه نمی‌شود', () => {
    // فقط به قاعده‌ی مبلغ و زمان می‌رسد؛ اینجا زمان یکی است پس همان را می‌دهد.
    const match = findDuplicate(candidate({ rawSms: null }), [tx()]);
    expect(match?.reason).toBe('same-amount-time');
  });
});

describe('مبلغ و زمان — هر دو از پیامک', () => {
  it('همان مبلغ با سه دقیقه فاصله تکراری است — بانک و درگاه', () => {
    const gateway = candidate({ rawSms: 'پرداخت 1,190,000 ریال از طریق درگاه سامان‌کیش', date: at('12:33') });
    const match = findDuplicate(gateway, [tx()]);

    expect(match?.reason).toBe('same-amount-time');
  });

  it('همان مبلغ با نیم ساعت فاصله تکراری نیست', () => {
    const later = candidate({ rawSms: 'پیامک دیگر 1,190,000', date: at('13:00') });
    expect(findDuplicate(later, [tx()])).toBeNull();
  });

  it('لبه‌ی بازه: دقیقاً ده دقیقه هنوز تکراری است، یک ثانیه بیشتر نه', () => {
    const edge = candidate({ rawSms: 'x 1,190,000', date: at('12:40') });
    const past = candidate({ rawSms: 'x 1,190,000', date: new Date(new Date(at('12:40')).getTime() + 1000).toISOString() });

    expect(findDuplicate(edge, [tx()])).not.toBeNull();
    expect(findDuplicate(past, [tx()])).toBeNull();
  });
});

describe('مبلغ و زمان — یکی دستی', () => {
  it('ثبت دستیِ شب برای خرید ظهر، همان روز تکراری است', () => {
    const manual = tx({ id: 'manual', rawSms: undefined, bank: undefined, date: at('21:00') });
    const match = findDuplicate(candidate(), [manual]);

    expect(match?.existing.id).toBe('manual');
    expect(match?.reason).toBe('same-amount-time');
  });

  it('همان مبلغ در روز قبل تکراری نیست', () => {
    const manual = tx({ id: 'manual', rawSms: undefined, date: at('23:50', '2026-09-09') });
    expect(findDuplicate(candidate({ date: at('00:10') }), [manual])).toBeNull();
  });
});

describe('چیزهایی که جدا می‌کنند', () => {
  it('بانک متفاوت، وقتی هر دو معلوم‌اند', () => {
    const other = candidate({ rawSms: 'y 1,190,000', bank: 'بانک ملت' });
    expect(findDuplicate(other, [tx()])).toBeNull();
  });

  it('بانک نامعلوم در یک طرف، جدا نمی‌کند', () => {
    const unknown = candidate({ rawSms: 'y 1,190,000', bank: null });
    expect(findDuplicate(unknown, [tx()])).not.toBeNull();
  });

  it('نوع متفاوت: واریز و برداشتِ هم‌مبلغ یکی نیستند', () => {
    const credit = candidate({ rawSms: 'واریز 1,190,000', type: 'credit' });
    expect(findDuplicate(credit, [tx()])).toBeNull();
  });

  it('مبلغ متفاوت', () => {
    const other = candidate({ rawSms: 'z 1,200,000', amount: 120_000 });
    expect(findDuplicate(other, [tx()])).toBeNull();
  });

  it('لیست خالی', () => {
    expect(findDuplicate(candidate(), [])).toBeNull();
  });
});

describe('انتخاب بین چند کاندید', () => {
  it('نزدیک‌ترین در زمان برمی‌گردد', () => {
    const far = tx({ id: 'far', rawSms: 'a 1,190,000', date: at('12:22') });
    const near = tx({ id: 'near', rawSms: 'b 1,190,000', date: at('12:31') });
    const probe = candidate({ rawSms: 'c 1,190,000' });

    expect(findDuplicate(probe, [far, near])?.existing.id).toBe('near');
  });

  it('متن خام یکسان بر مبلغ‌وزمانِ نزدیک‌تر مقدم است', () => {
    const nearer = tx({ id: 'nearer', rawSms: 'unrelated 1,190,000', date: at('12:30') });
    const exact = tx({ id: 'exact', date: at('12:39') });

    expect(findDuplicate(candidate(), [nearer, exact])?.existing.id).toBe('exact');
  });

  it('تراکنش با خودش تکراری نیست (ویرایش)', () => {
    expect(findDuplicate(candidate(), [tx()], 'tx_1')).toBeNull();
  });
});
