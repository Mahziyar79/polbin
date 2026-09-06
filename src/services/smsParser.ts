import { CategoryId, ParsedSms, TransactionType } from '../types';
import { toEnDigits } from '../utils/format';

/**
 * پارسر محلیِ پیامک بانکی — نسخه‌ی آینه‌ایِ همان regexهایی که قرار است
 * در بک‌اند (Node/Express) اجرا شوند. اینجا فقط برای اینکه جریان MVP
 * بدون سرور هم کار کند نگه داشته شده است.
 *
 * نکته: Hermes از lookbehind پشتیبانی نمی‌کند، پس هیچ‌جا از `(?<=...)` استفاده نشده.
 */

const BANKS = [
  'بانک ملت',
  'بانک ملی',
  'بانک سامان',
  'بانک تجارت',
  'بانک صادرات',
  'بانک پاسارگاد',
  'بانک پارسیان',
  'بانک سپه',
  'بانک رفاه',
  'بانک آینده',
  'بلوبانک',
];

const CREDIT_KEYWORDS = ['واریز', 'دریافت', 'بستانکار'];

/** کلیدواژه‌ی فروشگاه → دسته. اولین تطابق برنده است. */
const MERCHANT_RULES: Array<{ pattern: RegExp; merchant: string; category: CategoryId }> = [
  { pattern: /اسنپ\s*فود|اسنپ‌فود|snappfood/i, merchant: 'اسنپ‌فود', category: 'food' },
  { pattern: /تاکسی\s*اسنپ|اسنپ|snapp/i, merchant: 'اسنپ', category: 'transport' },
  { pattern: /تپسی|tapsi/i, merchant: 'تپسی', category: 'transport' },
  { pattern: /دیجی\s*کالا|digikala/i, merchant: 'دیجی‌کالا', category: 'shopping' },
  { pattern: /هایپر\s*استار|هایپراستار/i, merchant: 'هایپراستار', category: 'grocery' },
  { pattern: /جانبو|افق\s*کوروش|رفاه|شهروند|اکالا/i, merchant: 'فروشگاه زنجیره‌ای', category: 'grocery' },
  { pattern: /داروخانه|دارو/i, merchant: 'داروخانه', category: 'health' },
  { pattern: /بیمارستان|درمانگاه|آزمایشگاه|کلینیک/i, merchant: 'مرکز درمانی', category: 'health' },
  { pattern: /فیلیمو|نماوا|filimo|namava|اسپاتیفای/i, merchant: 'سرویس ویدیو', category: 'entertainment' },
  { pattern: /کافه|رستوران|فست\s*فود|چیلیویری/i, merchant: 'کافه/رستوران', category: 'food' },
  { pattern: /ایرانسل|همراه\s*اول|رایتل|شارژ/i, merchant: 'شارژ و بسته', category: 'bills' },
  { pattern: /قبض|برق|گاز|آب\s*بها|عوارض/i, merchant: 'قبض', category: 'bills' },
  { pattern: /کارت\s*به\s*کارت|انتقال\s*وجه|پایا|ساتنا/i, merchant: 'انتقال وجه', category: 'transfer' },
];

/** ی/ک عربی، نیم‌فاصله و فاصله‌های اضافه را یکدست می‌کند. */
function normalize(raw: string): string {
  return toEnDigits(raw)
    .replace(/[يﻱﻲ]/g, 'ی')
    .replace(/[كﻙﻚ]/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/[٬،]/g, ',')
    .replace(/[ \t]+/g, ' ');
}

interface AmountMatch {
  value: number;
  currency: 'rial' | 'toman';
  isBalance: boolean;
}

const AMOUNT_RE = /(\d[\d,]{2,})\s*(ریال|تومان)?/g;

function extractAmounts(text: string): AmountMatch[] {
  const results: AmountMatch[] = [];
  AMOUNT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = AMOUNT_RE.exec(text)) !== null) {
    const digits = match[1].replace(/,/g, '');
    if (digits.length < 4) continue;

    // به‌جای lookbehind: ۲۵ کاراکترِ قبل از عدد را نگاه می‌کنیم.
    const before = text.slice(Math.max(0, match.index - 25), match.index);
    results.push({
      value: Number(digits),
      currency: match[2] === 'تومان' ? 'toman' : 'rial',
      isBalance: /مانده|موجودی/.test(before),
    });
  }

  return results;
}

function extractMerchant(text: string): { merchant: string | null; category: CategoryId } {
  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(text)) {
      return { merchant: rule.merchant, category: rule.category };
    }
  }

  // اگر دیکشنری جواب نداد، سراغ برچسبِ «پذیرنده/فروشگاه» می‌رویم.
  const labelled = /(?:پذیرنده|فروشگاه|مرکز|شرح)\s*:?\s*([^\n\r]{2,40})/.exec(text);
  if (labelled) {
    return { merchant: labelled[1].trim(), category: 'other' };
  }

  return { merchant: null, category: 'other' };
}

export function parseSms(raw: string): ParsedSms {
  const text = normalize(raw);

  const amounts = extractAmounts(text);
  const spend = amounts.find(a => !a.isBalance) ?? amounts[0] ?? null;
  const amount = spend ? (spend.currency === 'rial' ? spend.value / 10 : spend.value) : null;

  const { merchant, category } = extractMerchant(text);

  const bank = BANKS.find(b => text.includes(b.replace('بانک ', ''))) ?? null;
  const cardMatch = /\*{2,}\s*(\d{4})/.exec(text);
  const type: TransactionType = CREDIT_KEYWORDS.some(k => text.includes(k)) ? 'credit' : 'debit';

  // TODO: استخراج تاریخ شمسی از متن پیامک (الگوی 1404/06/14) و تبدیل به میلادی.
  const date = new Date().toISOString();

  let confidence = 0;
  if (amount) confidence += 0.5;
  if (merchant) confidence += 0.3;
  if (bank) confidence += 0.1;
  if (cardMatch) confidence += 0.1;

  return {
    amount,
    merchant,
    categoryId: category,
    date,
    bank,
    cardLast4: cardMatch ? cardMatch[1] : null,
    type,
    confidence: Number(confidence.toFixed(2)),
    raw,
  };
}
