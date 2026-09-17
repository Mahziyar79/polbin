import { ParsedSms, Transaction } from '../types';
import { parseSms } from './smsParser';

/**
 * لایه‌ی جعلیِ API. همه‌ی امضاها عمداً async هستند تا وقتی بک‌اند
 * (Node/Express + PostgreSQL) آماده شد فقط بدنه‌ی همین توابع عوض شود.
 *
 * TODO: جایگزینی با fetch به BASE_URL بک‌اند.
 */

/**
 * POST /sms/parse — همان کاری که بک‌اند با regex انجام می‌دهد.
 *
 * تأخیر ساختگی ندارد: قبلاً ۶۰۰ میلی‌ثانیه «در حال خواندن پیامک…» نشان می‌داد
 * برای کاری که روی خود گوشی یک میلی‌ثانیه طول می‌کشد.
 */
export async function parseSmsRemote(raw: string): Promise<ParsedSms> {
  return parseSms(raw);
}

/** POST /transactions */
export async function createTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
  return { ...input, id: `tx_${Date.now()}_${Math.floor(Math.random() * 1e6)}` };
}
