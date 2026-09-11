import { NativeModules } from 'react-native';
import { toBase64 } from './xlsx';

interface PolbinFilesModule {
  /** فایل را می‌سازد و منوی هم‌رسانی را باز می‌کند؛ مسیر فایل را برمی‌گرداند. */
  saveAndShare(fileName: string, mimeType: string, content: string): Promise<string>;
  /** همان، برای فایل باینری؛ محتوا base64 است. */
  saveAndShareBase64(fileName: string, mimeType: string, base64: string): Promise<string>;
  /** محتوای فایل انتخاب‌شده، یا null اگر کاربر منصرف شود. */
  pickTextFile(): Promise<string | null>;
  /** پنجره‌ی چاپ اندروید را با محتوای HTML باز می‌کند. */
  printHtml(html: string, jobName: string): Promise<boolean>;
}

/**
 * ماژول نیتیو خودمان در `android/app/src/main/java/com/polbin/PolbinFilesModule.kt`.
 *
 * اگر اپ بدون بیلد دوباره اجرا شود این تهی است، برای همین هر تابع جداگانه
 * چک می‌کند تا به‌جای کرش، پیام روشن بدهد.
 */
const native = NativeModules.PolbinFiles as PolbinFilesModule | undefined;

const MISSING = 'این قابلیت نیاز به نصب دوباره‌ی اپ دارد.';

export function isAvailable(): boolean {
  return Boolean(native);
}

export async function saveAndShare(
  fileName: string,
  mimeType: string,
  content: string,
): Promise<void> {
  if (!native) throw new Error(MISSING);
  await native.saveAndShare(fileName, mimeType, content);
}

/** فایل باینری (مثل xlsx). بایت‌ها base64 می‌شوند چون bridge فقط رشته می‌برد. */
export async function saveAndShareBytes(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<void> {
  if (!native) throw new Error(MISSING);
  if (typeof native.saveAndShareBase64 !== 'function') throw new Error(MISSING);
  await native.saveAndShareBase64(fileName, mimeType, toBase64(bytes));
}

export async function pickTextFile(): Promise<string | null> {
  if (!native) throw new Error(MISSING);
  return native.pickTextFile();
}

export async function printHtml(html: string, jobName: string): Promise<void> {
  if (!native) throw new Error(MISSING);
  await native.printHtml(html, jobName);
}
