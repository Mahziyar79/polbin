import { buildTransactionsXlsx, crc32, toBase64, transactionRows, utf8, zipStored } from '../src/services/xlsx';
import { Category, Transaction } from '../src/types';

const categories: Category[] = [
  { id: 'food', label: 'رستوران و کافه', color: '#000', emoji: '🍔', kind: 'debit' },
  { id: 'salary', label: 'حقوق', color: '#000', emoji: '💰', kind: 'credit' },
];

const transactions: Transaction[] = [
  {
    id: 'a',
    amount: 119_000,
    merchant: 'اسنپ‌فود',
    categoryId: 'food',
    date: '2026-09-10T08:02:00.000Z',
    type: 'debit',
    bank: 'بانک رفاه',
    cardLast4: '1234',
    rawSms: 'نباید در خروجی باشد',
  },
  {
    id: 'b',
    amount: 30_000_000,
    merchant: 'شرکت <نمونه> & شرکا',
    categoryId: 'salary',
    date: '2026-09-11T05:00:00.000Z',
    type: 'credit',
  },
];

function latin1(bytes: Uint8Array): string {
  return Array.from(bytes, b => String.fromCharCode(b)).join('');
}

describe('پایه‌ها', () => {
  it('crc32 مقدار مرجع را می‌دهد', () => {
    // مقدار استاندارد آزمون CRC-32 برای «123456789».
    expect(crc32(utf8('123456789'))).toBe(0xcbf43926);
  });

  it('utf8 حروف فارسی و ایموجی را درست می‌نویسد', () => {
    expect(Array.from(utf8('ا'))).toEqual([0xd8, 0xa7]);
    expect(Array.from(utf8('🍔'))).toEqual([0xf0, 0x9f, 0x8d, 0x94]);
  });

  it('base64 با RFC یکی است', () => {
    expect(toBase64(utf8('Man'))).toBe('TWFu');
    expect(toBase64(utf8('Ma'))).toBe('TWE=');
    expect(toBase64(utf8('M'))).toBe('TQ==');
  });
});

describe('zip', () => {
  it('با امضای PK شروع می‌شود و نام‌ها را در جدول مرکزی دارد', () => {
    const bytes = zipStored([{ name: 'a.txt', data: utf8('hello') }]);
    const text = latin1(bytes);

    expect(text.startsWith('PK')).toBe(true);
    expect(text).toContain('PK');
    expect(text).toContain('PK');
    expect(text.split('a.txt').length - 1).toBe(2);
  });
});

describe('ردیف‌های تراکنش', () => {
  const rows = transactionRows(transactions, categories);

  it('تیتر و یک ردیف به ازای هر تراکنش، تازه‌ترین اول', () => {
    expect(rows).toHaveLength(3);
    expect(rows[1][4]).toEqual({ text: 'شرکت <نمونه> & شرکا' });
    expect(rows[2][4]).toEqual({ text: 'اسنپ‌فود' });
  });

  it('مبلغ عدد واقعی است، نه متن', () => {
    expect(rows[2][3]).toEqual({ number: 119_000 });
  });

  it('دسته با برچسبش می‌آید، نه شناسه', () => {
    expect(rows[2][5]).toEqual({ text: 'رستوران و کافه' });
    expect(rows[1][5]).toEqual({ text: 'حقوق' });
  });

  it('فیلدهای خالی، خالی می‌مانند', () => {
    expect(rows[1][6]).toEqual({ text: '' });
    expect(rows[1][7]).toEqual({ text: '' });
  });
});

describe('فایل xlsx', () => {
  const bytes = buildTransactionsXlsx(transactions, categories);
  const text = latin1(bytes);

  it('همه‌ی بخش‌های لازم را دارد', () => {
    for (const part of [
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/worksheets/sheet1.xml',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('کاراکترهای خاص XML را escape می‌کند', () => {
    expect(text).toContain(latin1(utf8('&lt;نمونه&gt; &amp; شرکا')));
    expect(text).not.toContain(latin1(utf8('<نمونه>')));
  });

  it('متن خام پیامک را در خروجی نمی‌گذارد', () => {
    expect(text).not.toContain(latin1(utf8('نباید در خروجی باشد')));
  });

  it('راست‌به‌چپ و ردیف تیتر ثابت', () => {
    expect(text).toContain('rightToLeft="1"');
    expect(text).toContain('state="frozen"');
  });
});
