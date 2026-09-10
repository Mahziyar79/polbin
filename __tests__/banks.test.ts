import { BANK_NAMES, BANKS, findBank } from '../src/data/banks';
import { parseSms } from '../src/services/smsParser';

describe('فهرست بانک‌ها', () => {
  it('شناسه و نام تکراری ندارد', () => {
    expect(new Set(BANKS.map(b => b.id)).size).toBe(BANKS.length);
    expect(new Set(BANK_NAMES).size).toBe(BANKS.length);
  });

  it('هر بانک نام کوتاه و رنگ دارد', () => {
    for (const bank of BANKS) {
      expect(bank.short.length).toBeGreaterThan(0);
      expect(bank.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('findBank با نام کامل پیدا می‌کند و با ناشناس null می‌دهد', () => {
    expect(findBank('بانک ملت')?.id).toBe('mellat');
    expect(findBank('بانک نامعلوم')).toBeNull();
    expect(findBank(null)).toBeNull();
    expect(findBank(undefined)).toBeNull();
  });
});

describe('هم‌خوانی پارسر با فهرست بانک‌ها', () => {
  /**
   * مهم‌ترین تست این فایل.
   *
   * نام بانکی که پارسر از پیامک درمی‌آورد باید دقیقاً همان رشته‌ای باشد که
   * کاربر از دراپ‌داون انتخاب می‌کند؛ وگرنه فیلتر بانک، تراکنش‌های پیامکی و
   * دستیِ یک بانک را دو چیز جدا می‌بیند.
   */
  it('نامی که پارسر برمی‌گرداند در فهرست هست', () => {
    const result = parseSms('بانک ملت\nخرید\nمبلغ: 1,850,000 ریال\nمانده: 42,310,000 ریال');

    expect(result.bank).toBe('بانک ملت');
    expect(findBank(result.bank)).not.toBeNull();
  });

  it('برای چند بانک مختلف هم برقرار است', () => {
    const samples = ['بانک صادرات', 'بانک سامان', 'بانک رفاه', 'بلوبانک'];

    for (const name of samples) {
      const result = parseSms(`${name}\nخرید\nمبلغ: 500,000 ریال\nمانده: 1,000,000 ریال`);
      expect(result.bank).toBe(name);
      expect(findBank(result.bank)).not.toBeNull();
    }
  });

  it('پیامک بدون نام بانک، بانک null می‌دهد', () => {
    const result = parseSms('خرید\nمبلغ: 500,000 ریال\nمانده: 1,000,000 ریال');
    expect(result.bank).toBeNull();
  });
});
