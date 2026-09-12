import { NativeModules } from 'react-native';
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from './storage';

interface PolbinLockModule {
  randomSalt(): Promise<string>;
  hashPin(pin: string, saltHex: string): Promise<string>;
  verifyPin(pin: string, saltHex: string, expectedHex: string): Promise<boolean>;
  biometricAvailable(): Promise<boolean>;
  authenticate(title: string, negativeText: string): Promise<boolean>;
}

const native = NativeModules.PolbinLock as PolbinLockModule | undefined;

/** آنچه ذخیره می‌شود — هرگز خودِ رمز. */
export interface LockConfig {
  saltHex: string;
  hashHex: string;
  /** کاربر اثر انگشت را هم روشن کرده. */
  biometric: boolean;
}

/**
 * ماژول نیتیو در بیلدی که دوباره ساخته نشده وجود ندارد. در آن حالت قفل باید
 * «غیرفعال» حساب شود نه «قفل‌شده»؛ وگرنه کاربر پشت دری می‌ماند که هیچ کلیدی
 * بازش نمی‌کند.
 */
export function isLockAvailable(): boolean {
  return Boolean(native);
}

export function readLockConfig(): LockConfig | null {
  const config = readJSON<LockConfig | null>(STORAGE_KEYS.lock, null);
  if (!config || typeof config.saltHex !== 'string' || typeof config.hashHex !== 'string') {
    return null;
  }
  return config;
}

export async function saveNewPin(pin: string, biometric: boolean): Promise<LockConfig> {
  if (!native) throw new Error('ماژول قفل در دسترس نیست.');
  const saltHex = await native.randomSalt();
  const hashHex = await native.hashPin(pin, saltHex);
  const config: LockConfig = { saltHex, hashHex, biometric };
  writeJSON(STORAGE_KEYS.lock, config);
  return config;
}

export function saveBiometricFlag(config: LockConfig, biometric: boolean): LockConfig {
  const next = { ...config, biometric };
  writeJSON(STORAGE_KEYS.lock, next);
  return next;
}

export function clearLock(): void {
  removeKey(STORAGE_KEYS.lock);
}

export async function verifyPin(pin: string, config: LockConfig): Promise<boolean> {
  if (!native) return false;
  return native.verifyPin(pin, config.saltHex, config.hashHex);
}

export async function biometricAvailable(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.biometricAvailable();
  } catch {
    return false;
  }
}

/** true تایید شد، false کاربر بست؛ خطای واقعی throw می‌شود. */
export async function authenticateBiometric(): Promise<boolean> {
  if (!native) return false;
  return native.authenticate('باز کردن پول‌بین', 'رمز عبور');
}
