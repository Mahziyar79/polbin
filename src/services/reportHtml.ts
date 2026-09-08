import { Category, Transaction } from '../types';
import { resolveCategory } from '../data/categories';
import { formatToman, toFaDigits } from '../utils/format';
import { jalaliLongDate, toJalali } from '../utils/jalali';

/**
 * ساخت HTML گزارش برای چاپ.
 *
 * چرا HTML و نه رسم مستقیم PDF: شکل‌دهی حروف فارسی و چیدمان راست‌به‌چپ کار
 * سنگینی است و WebView اندروید هر دو را درست انجام می‌دهد. پنجره‌ی چاپ سیستم
 * هم گزینه‌ی «ذخیره به‌صورت PDF» دارد.
 */
export interface ReportInput {
  transactions: Transaction[];
  categories: Category[];
  periodLabel: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortJalali(iso: string): string {
  const { jy, jm, jd } = toJalali(new Date(iso));
  const pad = (value: number) => String(value).padStart(2, '0');
  return toFaDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

export function buildReportHtml({ transactions, categories, periodLabel }: ReportInput): string {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const expenses = sorted.filter(tx => tx.type === 'debit');
  const incomes = sorted.filter(tx => tx.type === 'credit');
  const sum = (list: Transaction[]) => list.reduce((total, tx) => total + tx.amount, 0);
  const net = sum(incomes) - sum(expenses);

  const rows = sorted
    .map(tx => {
      const category = resolveCategory(categories, tx.categoryId, tx.type);
      const isIncome = tx.type === 'credit';

      return `
        <tr>
          <td>${shortJalali(tx.date)}</td>
          <td>${escapeHtml(tx.merchant)}</td>
          <td>${escapeHtml(category.label)}</td>
          <td class="${isIncome ? 'income' : 'expense'}">
            ${isIncome ? '+' : '−'} ${escapeHtml(formatToman(tx.amount, false))}
          </td>
        </tr>`;
    })
    .join('');

  // فونت داخل WebView در دسترس نیست، پس به فونت‌های سیستمی فارسی تکیه می‌کنیم.
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Vazirmatn, Tahoma, "Noto Naskh Arabic", sans-serif;
    color: #12343B;
    padding: 24px;
    font-size: 12px;
  }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #51696F; font-size: 11px; margin-bottom: 20px; }
  .totals { display: flex; gap: 12px; margin-bottom: 20px; }
  .card {
    flex: 1;
    border: 1px solid #DEE8E5;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .card span { display: block; color: #51696F; font-size: 10px; margin-bottom: 4px; }
  .card strong { font-size: 14px; }
  .expense { color: #C0554F; }
  .income { color: #16B86A; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: right; padding: 7px 8px; border-bottom: 1px solid #E8EFED; }
  th { background: #F1F6F5; font-size: 11px; color: #51696F; }
  td:last-child, th:last-child { text-align: left; white-space: nowrap; }
  tfoot td { font-weight: bold; border-top: 2px solid #DEE8E5; border-bottom: none; }
  .empty { color: #8AA1A6; text-align: center; padding: 30px 0; }
</style>
</head>
<body>
  <h1>گزارش پول‌بین</h1>
  <div class="meta">${escapeHtml(periodLabel)} · تهیه‌شده در ${escapeHtml(
    toFaDigits(jalaliLongDate(new Date())),
  )}</div>

  <div class="totals">
    <div class="card">
      <span>مجموع درآمد</span>
      <strong class="income">${escapeHtml(formatToman(sum(incomes)))}</strong>
    </div>
    <div class="card">
      <span>مجموع هزینه</span>
      <strong class="expense">${escapeHtml(formatToman(sum(expenses)))}</strong>
    </div>
    <div class="card">
      <span>مانده</span>
      <strong class="${net >= 0 ? 'income' : 'expense'}">
        ${net >= 0 ? '+' : '−'} ${escapeHtml(formatToman(Math.abs(net)))}
      </strong>
    </div>
  </div>

  ${
    sorted.length === 0
      ? '<div class="empty">در این بازه تراکنشی ثبت نشده است.</div>'
      : `<table>
    <thead>
      <tr><th>تاریخ</th><th>شرح</th><th>دسته</th><th>مبلغ (تومان)</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">مجموع ${toFaDigits(sorted.length)} تراکنش</td>
        <td class="${net >= 0 ? 'income' : 'expense'}">
          ${net >= 0 ? '+' : '−'} ${escapeHtml(formatToman(Math.abs(net), false))}
        </td>
      </tr>
    </tfoot>
  </table>`
  }
</body>
</html>`;
}
