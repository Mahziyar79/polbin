import { FAKE_SMS_INBOX } from '../data/fakeSmsInbox';
import { FAKE_TRANSACTIONS } from '../data/fakeTransactions';
import { ParsedSms, Transaction } from '../types';
import { parseSms } from './smsParser';

/**
 * لایه‌ی جعلیِ API. همه‌ی امضاها عمداً async هستند تا وقتی بک‌اند
 * (Node/Express + PostgreSQL) آماده شد فقط بدنه‌ی همین توابع عوض شود.
 *
 * TODO: جایگزینی با fetch به BASE_URL بک‌اند.
 */

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export interface AuthUser {
  id: string;
  phone: string;
  displayName: string;
}

/** POST /auth/otp/request */
export async function requestOtp(phone: string): Promise<{ ok: true; ttlSeconds: number }> {
  await delay(700);
  if (!/^09\d{9}$/.test(phone)) {
    throw new Error('شماره موبایل معتبر نیست.');
  }
  return { ok: true, ttlSeconds: 120 };
}

/** POST /auth/otp/verify — در حالت جعلی هر کد ۴ رقمی پذیرفته می‌شود. */
export async function verifyOtp(phone: string, code: string): Promise<{ token: string; user: AuthUser }> {
  await delay(700);
  if (!/^\d{4}$/.test(code)) {
    throw new Error('کد تایید باید ۴ رقم باشد.');
  }
  return {
    token: 'fake-jwt-token',
    user: { id: 'user_1', phone, displayName: 'کاربر پول‌بین' },
  };
}

/** POST /sms/parse — همان کاری که بک‌اند با regex انجام می‌دهد. */
export async function parseSmsRemote(raw: string): Promise<ParsedSms> {
  await delay(600);
  return parseSms(raw);
}

/** GET /transactions */
export async function fetchTransactions(): Promise<Transaction[]> {
  await delay(400);
  return FAKE_TRANSACTIONS;
}

/** POST /transactions */
export async function createTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
  await delay(450);
  return { ...input, id: `tx_${Date.now()}` };
}

/** صف پیامک‌های نمونه برای دکمه‌ی «شبیه‌سازی دریافت پیامک». */
export function getFakeSms(index: number): string {
  return FAKE_SMS_INBOX[index % FAKE_SMS_INBOX.length];
}

export const FAKE_SMS_COUNT = FAKE_SMS_INBOX.length;
