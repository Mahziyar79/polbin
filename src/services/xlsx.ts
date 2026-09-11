/* eslint-disable no-bitwise -- CRC32 و zip و base64 بدون عملگر بیتی نوشته نمی‌شوند. */
import { Category, Transaction } from '../types';
import { formatJalaliDate, formatTime } from '../utils/format';
import { toJalali } from '../utils/jalali';

/**
 * ساخت فایل اکسل (.xlsx) از تراکنش‌ها — بدون کتابخانه.
 *
 * چرا خودمان نوشتیم: کتابخانه‌های xlsx برای ری‌اکت‌نیتیو یا یک مگابایت به بسته
 * اضافه می‌کنند یا polyfill نیتیو می‌خواهند. فایل xlsx در واقع یک zip از چند
 * XML است؛ zip بدون فشرده‌سازی («stored») و XML با رشته‌های داخل‌خطی
 * (`inlineStr`) هر دو ساده‌اند و مجموعاً کمتر از دویست خط می‌شوند. اکسل،
 * گوگل‌شیت و LibreOffice هر سه این خروجی را بی‌هشدار باز می‌کنند.
 *
 * چرا CSV نه: CSV نه ستون‌بندی راست‌به‌چپ دارد، نه عرض ستون، و اکسل ویندوز
 * بدون BOM حروف فارسی‌اش را خراب می‌خواند. مبلغ هم اینجا عدد واقعی است تا
 * کاربر بتواند رویش SUM بزند.
 */

const SHEET_NAME = 'تراکنش‌ها';

/** ستون‌های خروجی، به ترتیب. */
const HEADERS = [
  'تاریخ شمسی',
  'ساعت',
  'نوع',
  'مبلغ (تومان)',
  'فروشگاه / منبع',
  'دسته',
  'بانک',
  'کارت',
  'مانده بعد از تراکنش',
  'تاریخ میلادی',
];

/** عرض تقریبی هر ستون به واحد کاراکتر اکسل. */
const WIDTHS = [14, 8, 8, 16, 26, 18, 16, 8, 20, 22];

type Cell = { text: string } | { number: number };

// ---------- XML ----------

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A, B, …, Z, AA, AB … */
function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cellXml(cell: Cell, column: number, row: number, style: number): string {
  const ref = `${columnLetter(column)}${row}`;
  if ('number' in cell) {
    return `<c r="${ref}" s="${style}"><v>${cell.number}</v></c>`;
  }
  // xml:space="preserve" تا فاصله‌ی اول/آخر فروشگاه‌ها نپرد.
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.text)}</t></is></c>`;
}

function sheetXml(rows: Cell[][]): string {
  const cols = WIDTHS.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');

  const body = rows
    .map((cells, r) => {
      const style = r === 0 ? 1 : 0;
      const inner = cells.map((cell, c) => cellXml(cell, c, r + 1, style)).join('');
      return `<row r="${r + 1}">${inner}</row>`;
    })
    .join('');

  // rightToLeft: ستون A سمت راست می‌نشیند، همان‌طور که کاربر فارسی انتظار دارد.
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${body}</sheetData>` +
    `</worksheet>`
  );
}

/** دو استایل: عادی و تیتر (پررنگ). فرمت عدد با جداکننده‌ی هزارگان. */
const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="2">` +
  `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

const CONTENT_TYPES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
  `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
  `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
  `</Types>`;

const ROOT_RELS_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
  `</Relationships>`;

const WORKBOOK_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
  `<sheets><sheet name="${escapeXml(SHEET_NAME)}" sheetId="1" r:id="rId1"/></sheets>` +
  `</workbook>`;

const WORKBOOK_RELS_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
  `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
  `</Relationships>`;

// ---------- ZIP (stored, بدون فشرده‌سازی) ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** UTF-8 بدون TextEncoder — Hermes نسخه‌های قدیمی‌تر آن را ندارد. */
export function utf8(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return Uint8Array.from(out);
}

function le16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}

function le32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** چسباندن تکه‌ها بدون spread — spread روی صدها کیلوبایت بایت، پشته‌ی Hermes را می‌ترکاند. */
function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * zip با روش «stored»: هیچ فشرده‌سازی‌ای نیست، فقط سرآیندها و جدول مرکزی.
 * برای چند هزار ردیف، فایل زیر یک مگابایت می‌ماند و ارزش پیاده‌سازی deflate را ندارد.
 */
export function zipStored(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = utf8(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // سرآیند محلی. بیت ۱۱ در flags یعنی نام فایل UTF-8 است.
    const local = Uint8Array.from([
      ...le32(0x04034b50),
      ...le16(20),
      ...le16(0x0800),
      ...le16(0),
      ...le16(0),
      ...le16(0),
      ...le32(crc),
      ...le32(size),
      ...le32(size),
      ...le16(name.length),
      ...le16(0),
    ]);
    parts.push(local, name, entry.data);

    central.push(
      Uint8Array.from([
        ...le32(0x02014b50),
        ...le16(20),
        ...le16(20),
        ...le16(0x0800),
        ...le16(0),
        ...le16(0),
        ...le16(0),
        ...le32(crc),
        ...le32(size),
        ...le32(size),
        ...le16(name.length),
        ...le16(0),
        ...le16(0),
        ...le16(0),
        ...le16(0),
        ...le32(0),
        ...le32(offset),
      ]),
      name,
    );

    offset += local.length + name.length + size;
  }

  const centralBytes = concat(central);
  const end = Uint8Array.from([
    ...le32(0x06054b50),
    ...le16(0),
    ...le16(0),
    ...le16(entries.length),
    ...le16(entries.length),
    ...le32(centralBytes.length),
    ...le32(offset),
    ...le16(0),
  ]);

  return concat([...parts, centralBytes, end]);
}

// ---------- ردیف‌ها ----------

function labelOf(categories: Category[], id: string): string {
  return categories.find(category => category.id === id)?.label ?? id;
}

export function transactionRows(transactions: Transaction[], categories: Category[]): Cell[][] {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const rows: Cell[][] = [HEADERS.map(text => ({ text }))];

  for (const tx of sorted) {
    const { jy, jm, jd } = toJalali(new Date(tx.date));
    rows.push([
      { text: formatJalaliDate(tx.date) },
      { text: formatTime(tx.date) },
      { text: tx.type === 'debit' ? 'خرج' : 'درآمد' },
      { number: tx.amount },
      { text: tx.merchant },
      { text: labelOf(categories, tx.categoryId) },
      { text: tx.bank ?? '' },
      { text: tx.cardLast4 ?? '' },
      // مانده فقط در تراکنش‌های پیامکی هست؛ خانه‌ی خالی یعنی «معلوم نیست»، نه صفر.
      typeof tx.balance === 'number' ? { number: tx.balance } : { text: '' },
      // برای مرتب‌سازی در اکسل؛ تاریخ شمسیِ متنی مرتب نمی‌شود.
      { text: `${tx.date.slice(0, 10)} (${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')})` },
    ]);
  }

  return rows;
}

/** بایت‌های فایل .xlsx. */
export function buildTransactionsXlsx(transactions: Transaction[], categories: Category[]): Uint8Array {
  return zipStored([
    { name: '[Content_Types].xml', data: utf8(CONTENT_TYPES_XML) },
    { name: '_rels/.rels', data: utf8(ROOT_RELS_XML) },
    { name: 'xl/workbook.xml', data: utf8(WORKBOOK_XML) },
    { name: 'xl/_rels/workbook.xml.rels', data: utf8(WORKBOOK_RELS_XML) },
    { name: 'xl/styles.xml', data: utf8(STYLES_XML) },
    { name: 'xl/worksheets/sheet1.xml', data: utf8(sheetXml(transactionRows(transactions, categories))) },
  ]);
}

/** base64 بدون Buffer — برای فرستادن بایت‌ها به ماژول نیتیو از روی bridge رشته‌ای. */
export function toBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += chars[(triple >> 18) & 63] + chars[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[triple & 63] : '=';
  }
  return out;
}

export function xlsxFileName(date = new Date()): string {
  const { jy, jm, jd } = toJalali(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `polbin-${jy}-${pad(jm)}-${pad(jd)}.xlsx`;
}
