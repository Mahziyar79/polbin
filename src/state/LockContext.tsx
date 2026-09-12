import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  authenticateBiometric,
  clearLock,
  isLockAvailable,
  LockConfig,
  readLockConfig,
  saveBiometricFlag,
  saveNewPin,
  verifyPin,
} from '../services/lock';
import { cooldownMs, shouldLockOnResume } from '../services/lockPolicy';

interface LockContextValue {
  /** ماژول نیتیو هست؟ اگر نه، تنظیمات قفل نمایش داده نمی‌شود. */
  available: boolean;
  /** کاربر رمز گذاشته. */
  enabled: boolean;
  biometric: boolean;
  /** الان باید صفحه‌ی قفل روی اپ باشد. */
  locked: boolean;
  /** تعداد رمزهای غلط پشت‌هم از آخرین باز شدن. */
  failedAttempts: number;
  /** میلی‌ثانیه‌ای که باید صبر کند؛ صفر یعنی آزاد. */
  cooldownUntil: number;
  tryPin: (pin: string) => Promise<boolean>;
  tryBiometric: () => Promise<boolean>;
  enable: (pin: string, biometric: boolean) => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  setBiometric: (on: boolean) => void;
  disable: () => void;
}

const LockContext = createContext<LockContextValue | null>(null);

/**
 * قفل اپ.
 *
 * قفل یک لایه روی کل اپ است، نه یک صفحه در استک: ناوبری زیرش کامل mount
 * می‌ماند تا پیامکی که با نوتیف رسیده، بعد از باز شدن قفل سر جایش باشد.
 *
 * قفل شدن دوباره با رفتن به پس‌زمینه است، با مهلت کوتاه — شرحش در
 * `lockPolicy.ts`.
 */
export function LockProvider({ children }: { children: React.ReactNode }) {
  const available = isLockAvailable();
  const [config, setConfig] = useState<LockConfig | null>(() => (available ? readLockConfig() : null));
  const [locked, setLocked] = useState<boolean>(() => available && readLockConfig() !== null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const backgroundAt = useRef<number | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        if (backgroundAt.current === null) backgroundAt.current = Date.now();
        return;
      }

      if (state === 'active') {
        const since = backgroundAt.current;
        backgroundAt.current = null;
        if (configRef.current && shouldLockOnResume(since, Date.now())) setLocked(true);
      }
    });

    return () => subscription.remove();
  }, []);

  const unlock = useCallback(() => {
    setLocked(false);
    setFailedAttempts(0);
    setCooldownUntil(0);
  }, []);

  const registerFailure = useCallback(() => {
    setFailedAttempts(current => {
      const next = current + 1;
      const wait = cooldownMs(next);
      if (wait > 0) setCooldownUntil(Date.now() + wait);
      return next;
    });
  }, []);

  const tryPin = useCallback(
    async (pin: string) => {
      if (!config) return false;
      if (Date.now() < cooldownUntil) return false;

      const ok = await verifyPin(pin, config);
      if (ok) unlock();
      else registerFailure();
      return ok;
    },
    [config, cooldownUntil, unlock, registerFailure],
  );

  const tryBiometric = useCallback(async () => {
    if (!config?.biometric) return false;
    const ok = await authenticateBiometric();
    if (ok) unlock();
    return ok;
  }, [config, unlock]);

  const enable = useCallback(async (pin: string, biometric: boolean) => {
    setConfig(await saveNewPin(pin, biometric));
  }, []);

  const changePin = useCallback(
    async (pin: string) => {
      setConfig(await saveNewPin(pin, config?.biometric ?? false));
    },
    [config],
  );

  const setBiometric = useCallback(
    (on: boolean) => {
      if (config) setConfig(saveBiometricFlag(config, on));
    },
    [config],
  );

  const disable = useCallback(() => {
    clearLock();
    setConfig(null);
    unlock();
  }, [unlock]);

  const value = useMemo<LockContextValue>(
    () => ({
      available,
      enabled: config !== null,
      biometric: config?.biometric ?? false,
      locked: config !== null && locked,
      failedAttempts,
      cooldownUntil,
      tryPin,
      tryBiometric,
      enable,
      changePin,
      setBiometric,
      disable,
    }),
    [available, config, locked, failedAttempts, cooldownUntil, tryPin, tryBiometric, enable, changePin, setBiometric, disable],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock باید داخل LockProvider استفاده شود.');
  return ctx;
}
