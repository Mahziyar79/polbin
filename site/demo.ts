/**
 * دموی زنده‌ی پارسر روی سایت معرفی.
 *
 * عمداً از همان `src/services/smsParser.ts` اپ استفاده می‌کند، نه یک کپی: اگر
 * پارسر اپ بهتر شود، دمو هم همان لحظه بهتر می‌شود و هیچ‌وقت دو رفتار متفاوت
 * نشان داده نمی‌شود. این فقط چون آن فایل هیچ وابستگی به ری‌اکت‌نیتیو ندارد ممکن
 * است — همان چیزی که تست‌های Jest هم از آن استفاده می‌کنند.
 *
 * همه‌چیز در مرورگر اجرا می‌شود؛ هیچ درخواستی به هیچ سروری نمی‌رود.
 */
import { BUILT_IN_CATEGORIES } from '../src/data/categories';
import { findBank } from '../src/data/banks';
import { parseSms } from '../src/services/smsParser';
import { formatJalaliDate, formatTime, formatToman, toFaDigits } from '../src/utils/format';

/** نمونه‌هایی برای کسی که پیامک بانکی دمِ دست ندارد. */
const SAMPLES: Array<{ label: string; text: string }> = [
  {
    label: 'خرید — بانک ملت',
    text: 'بانک ملت\nخريد\nمبلغ: 1,850,000ريال\nاز: ****3421\nمانده: 42,310,000ريال\nپذيرنده: اسنپ‌فود\n1404/06/14-21:12',
  },
  {
    label: 'واریز حقوق — سامان',
    text: 'همراه بانک سامان\nواریز حقوق\nمبلغ:۳۹۵,۰۰۰,۰۰۰ ریال\nبه کارت ****7788\nمانده:۴۱۲,۵۴۰,۰۰۰ ریال\n1404/06/01-09:30',
  },
  {
    label: 'واریز — بلوبانک',
    text: 'بلو: 78,000,000 ریال به حساب شما نشست.\nموجودی: 94,050,000 ریال\n1405.06.20 14:22',
  },
  {
    label: 'کارت‌به‌کارت — ملت',
    text: 'بانک ملت انتقال وجه کارت به کارت 5,000,000 ریال از کارت ****9876 مانده 90,000,000 ریال 1405/06/26-16:10',
  },
];

function categoryLabel(id: string): { label: string; emoji: string } {
  const found = BUILT_IN_CATEGORIES.find(category => category.id === id);
  return found ? { label: found.label, emoji: found.emoji } : { label: 'متفرقه', emoji: '📦' };
}

function row(label: string, value: string): string {
  return `<div class="row"><span class="k">${label}</span><span class="v">${value}</span></div>`;
}

function render(raw: string): string {
  if (raw.trim().length === 0) {
    return '<p class="hint">متن پیامک را اینجا بگذار یا یکی از نمونه‌های بالا را بزن.</p>';
  }

  const parsed = parseSms(raw);

  if (parsed.amount === null) {
    return `<p class="hint">مبلغی در این متن پیدا نشد. اگر این یک پیامک تراکنش بانکی است، در خود اپ دکمه‌ی
      «این پیامک درست خوانده نشد» هست تا برای ما بفرستی و در نسخه‌ی بعد خوانده شود.</p>`;
  }

  const income = parsed.type === 'credit';
  const category = categoryLabel(parsed.categoryId);
  const bank = findBank(parsed.bank);

  // شماره‌ی کارت/حساب فقط چهار رقم آخر است؛ خود پارسر هم بیشتر از این نگه نمی‌دارد.
  const account = parsed.cardLast4
    ? `کارت ${toFaDigits(parsed.cardLast4)}`
    : parsed.accountLast4
      ? `حساب ${toFaDigits(parsed.accountLast4)}`
      : null;

  return `
    <div class="result-head">
      <span class="badge ${income ? 'in' : 'out'}">${income ? 'درآمد' : 'خرج'}</span>
      <span class="amount ${income ? 'in' : 'out'}">${income ? '+' : '−'} ${formatToman(parsed.amount)}</span>
    </div>
    <div class="rows">
      ${row(income ? 'منبع' : 'فروشگاه', parsed.merchant ?? '—')}
      ${row('دسته', `${category.emoji} ${category.label}`)}
      ${row('بانک', bank ? bank.name : parsed.bank ?? '—')}
      ${account ? row('حساب', account) : ''}
      ${row('تاریخ', `${formatJalaliDate(parsed.date)}، ${formatTime(parsed.date)}`)}
      ${parsed.balance !== null ? row('مانده', formatToman(parsed.balance)) : ''}
    </div>
    <div class="confidence">
      <div class="bar"><span style="width:${Math.round(parsed.confidence * 100)}%"></span></div>
      <span>اطمینان پارسر: ${toFaDigits(Math.round(parsed.confidence * 100))}٪</span>
    </div>`;
}

function mount(): void {
  const input = document.getElementById('sms-input') as HTMLTextAreaElement | null;
  const output = document.getElementById('sms-output');
  const chips = document.getElementById('sms-samples');
  if (!input || !output || !chips) return;

  const update = () => {
    output.innerHTML = render(input.value);
  };

  SAMPLES.forEach(sample => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = sample.label;
    button.addEventListener('click', () => {
      input.value = sample.text;
      update();
      input.focus();
    });
    chips.appendChild(button);
  });

  input.addEventListener('input', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
