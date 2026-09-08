import { ParsedSms, Transaction } from '../types';
import { parseSms } from './smsParser';

/**
 * لایه‌ی جعلیِ API. همه‌ی امضاها عمداً async هستند تا وقتی بک‌اند
 * (Node/Express + PostgreSQL) آماده شد فقط بدنه‌ی همین توابع عوض شود.
 *
 * TODO: جایگزینی با fetch به BASE_URL بک‌اند.
 */

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** POST /sms/parse — همان کاری که بک‌اند با regex انجام می‌دهد. */
export async function parseSmsRemote(raw: string): Promise<ParsedSms> {
  await delay(600);
  return parseSms(raw);
}

/**
 * GET /transactions
 *
 * تا وقتی بک‌اند وصل نشده، کاربر جدید با لیست خالی شروع می‌کند —
 * نه با داده‌ی نمونه‌ی یک نفر دیگر.
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  await delay(200);
  return [];
}

/** POST /transactions */
export async function createTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
  await delay(450);
  return { ...input, id: `tx_${Date.now()}` };
}
