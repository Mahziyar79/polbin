import { CategoryId, ParsedSms, TransactionType } from '../types';
import { BANK_NAMES } from '../data/banks';
import { toEnDigits } from '../utils/format';
import { toGregorian, toJalali } from '../utils/jalali';

/**
 * پارسر محلیِ پیامک بانکی — نسخه‌ی آینه‌ایِ همان regexهایی که قرار است
 * در بک‌اند (Node/Express) اجرا شوند. اینجا فقط برای اینکه جریان MVP
 * بدون سرور هم کار کند نگه داشته شده است.
 *
 * نکته: Hermes از lookbehind پشتیبانی نمی‌کند، پس هیچ‌جا از `(?<=...)` استفاده نشده.
 */


/** برای پاک کردن نام بانک از متن قبل از تشخیص فروشگاه. */
const BANK_MENTION_RE = new RegExp(
  BANK_NAMES.map(name => name.replace('بانک ', 'بانک' + String.raw`\s*`)).join('|'),
  'g',
);

const CREDIT_KEYWORDS = ['واریز', 'دریافت', 'بستانکار', 'حقوق', 'پاداش', 'عودت', 'برگشت وجه'];

/** کلیدواژه‌ی فروشگاه → دسته. اولین تطابق برنده است. */
const MERCHANT_RULES: Array<{ pattern: RegExp; merchant: string; category: CategoryId }> = [
  // واریزها اول می‌آیند: پیامک واریز پذیرنده ندارد و بدون این قاعده‌ها
  // فیلد «منبع درآمد» خالی می‌ماند و دکمه‌ی ثبت غیرفعال می‌شود.
  { pattern: /حقوق|دستمزد|مستمری/, merchant: 'حقوق', category: 'salary' },
  { pattern: /عودت|برگشت\s*وجه|استرداد/, merchant: 'عودت وجه', category: 'refund' },
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
  /** بلافاصله بعد از کلیدواژه‌ی تراکنش آمده — قوی‌ترین نشانه‌ی مبلغ اصلی. */
  labelled: boolean;
  /** جداکننده‌ی هزارگان دارد؛ شماره‌ها معمولاً ندارند. */
  grouped: boolean;
}

const AMOUNT_RE = /(\d[\d,]{2,})\s*(ریال|تومان)?/g;

/** «مانده»، «موجودی» و «مانده حساب» — عددی که خرج نیست. */
const BALANCE_LABEL = /(?:مانده|موجودی)(?:\s*حساب)?$/;

/**
 * شناسه‌هایی که عدد بعدشان اصلاً مبلغ نیست.
 *
 * پیامک بعضی بانک‌ها شماره‌ی حساب را بدون فاصله می‌چسباند («حساب419675840»)
 * و چون جداکننده‌ی هزارگان هم ندارد، از دید regex از خود مبلغ قابل تشخیص نیست.
 */
const IDENTIFIER_LABEL = /(?:حساب|سپرده|شبا|کارت|شماره|مشتری|پیگیری|مرجع|سریال)$/;

/** کلیدواژه‌هایی که عدد بعدشان مبلغ تراکنش است. */
const SPEND_LABEL =
  /(?:خرید|خريد|برداشت|پرداخت|واریز|انتقال|مبلغ|بدهکار|بستانکار|کاهش|افزایش|وجه)$/;

function extractAmounts(text: string): AmountMatch[] {
  const results: AmountMatch[] = [];
  AMOUNT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = AMOUNT_RE.exec(text)) !== null) {
    const digits = match[1].replace(/,/g, '');
    if (digits.length < 4) continue;

    // به‌جای lookbehind: ۲۵ کاراکترِ قبل از عدد را نگاه می‌کنیم و
    // جداکننده‌های چسبیده به عدد را کنار می‌گذاریم تا به خود برچسب برسیم.
    const before = text.slice(Math.max(0, match.index - 25), match.index);
    const label = before.replace(/[\s:.\-–—]+$/, '');

    // ترتیب مهم است: «مانده حساب» هم به «حساب» ختم می‌شود، پس اول مانده.
    if (BALANCE_LABEL.test(label)) {
      results.push({
        value: Number(digits),
        currency: match[2] === 'تومان' ? 'toman' : 'rial',
        isBalance: true,
        labelled: false,
        grouped: match[1].includes(','),
      });
      continue;
    }

    if (IDENTIFIER_LABEL.test(label)) continue;

    results.push({
      value: Number(digits),
      currency: match[2] === 'تومان' ? 'toman' : 'rial',
      isBalance: false,
      labelled: SPEND_LABEL.test(label),
      grouped: match[1].includes(','),
    });
  }

  return results;
}

/**
 * انتخاب مبلغ تراکنش از بین عددهای پیامک.
 *
 * ترتیب اولویت: عددی که برچسب تراکنش دارد، بعد عددی که جداکننده‌ی هزارگان
 * دارد، بعد اولین عدد. «اولین عدد» به‌تنهایی کافی نیست چون بعضی بانک‌ها
 * شماره‌ی حساب را قبل از مبلغ می‌آورند.
 */
function pickSpendAmount(amounts: AmountMatch[]): AmountMatch | null {
  const spendable = amounts.filter(a => !a.isBalance);

  return (
    spendable.find(a => a.labelled) ??
    spendable.find(a => a.grouped) ??
    spendable[0] ??
    amounts[0] ??
    null
  );
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

/**
 * استخراج تاریخ از متن پیامک.
 *
 * سه شکل رایج در پیامک بانک‌های ایرانی:
 *   1404/06/14-21:12   سال کامل شمسی
 *   06/18-08:32        فقط ماه و روز
 *   14:05              فقط ساعت
 *
 * چرا مهم است: بدون این، پیامکِ دیروز با تاریخ «همین الان» ثبت می‌شد و هم
 * تقویم و هم مجموع «امروز» را خراب می‌کرد.
 */
function extractDate(text: string, now = new Date()): string | null {
  const time = /(\d{1,2}):(\d{2})/.exec(text);
  const hour = time ? Number(time[1]) : 0;
  const minute = time ? Number(time[2]) : 0;

  const full = /(1[34]\d{2})\/(\d{1,2})\/(\d{1,2})/.exec(text);
  if (full) {
    const date = toGregorian(Number(full[1]), Number(full[2]), Number(full[3]));
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }

  // ماه/روز بدون سال. سال شمسیِ جاری را می‌گذاریم؛ اگر تاریخ در آینده افتاد
  // یعنی پیامک مال سال قبل است (پیامکِ اسفند که در فروردین وارد می‌شود).
  const short = /(?:^|[^\d/])(\d{1,2})\/(\d{1,2})(?![\d/])/.exec(text);
  if (short) {
    const month = Number(short[1]);
    const day = Number(short[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const { jy } = toJalali(now);
    let date = toGregorian(jy, month, day);
    date.setHours(hour, minute, 0, 0);

    if (date.getTime() > now.getTime() + 86_400_000) {
      date = toGregorian(jy - 1, month, day);
      date.setHours(hour, minute, 0, 0);
    }
    return date.toISOString();
  }

  // فقط ساعت: همان امروز.
  if (time) {
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }

  return null;
}

export function parseSms(raw: string): ParsedSms {
  const text = normalize(raw);

  const amounts = extractAmounts(text);
  const spend = pickSpendAmount(amounts);
  const amount = spend ? (spend.currency === 'rial' ? spend.value / 10 : spend.value) : null;

  // نام بانک از متن برداشته می‌شود چون بعضی بانک‌ها هم‌نام فروشگاه‌های
  // زنجیره‌ای‌اند: «بانک رفاه» نباید فروشگاه رفاه خوانده شود.
  const { merchant, category } = extractMerchant(text.replace(BANK_MENTION_RE, ' '));

  const bank = BANK_NAMES.find(name => text.includes(name.replace('بانک ', ''))) ?? null;
  const cardMatch = /\*{2,}\s*(\d{4})/.exec(text);
  const type: TransactionType = CREDIT_KEYWORDS.some(k => text.includes(k)) ? 'credit' : 'debit';

  const date = extractDate(text) ?? new Date().toISOString();

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
