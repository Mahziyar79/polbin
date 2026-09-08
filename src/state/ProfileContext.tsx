import React, { createContext, useContext, useMemo, useState } from 'react';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { Profile } from '../types';

interface ProfileContextValue {
  profile: Profile;
  setDisplayName: (name: string) => void;
}

const EMPTY_PROFILE: Profile = { displayName: '' };

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * پروفایل محلیِ کاربر — فعلاً فقط یک نام برای سلام گفتن.
 *
 * جای صفحه‌ی ورود جعلی را گرفته است. آن صفحه هر شماره و هر کد چهاررقمی را
 * قبول می‌کرد، پس نه امنیتی می‌آورد و نه هویتی؛ فقط یک مانع بین کاربر و اپ بود.
 * وقتی احراز هویت واقعی (پیامک + توکن سرور) آمد، همین‌جا کنارش می‌نشیند:
 * پروفایل از سرور پر می‌شود به‌جای حافظه‌ی گوشی.
 */
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // خواندن همگام است، پس نام در همان اولین رندر موجود است و داشبورد پرش نمی‌زند.
  const [profile, setProfile] = useState<Profile>(() =>
    readJSON<Profile>(STORAGE_KEYS.profile, EMPTY_PROFILE),
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      setDisplayName: (name: string) => {
        const next: Profile = { displayName: name.trim() };
        writeJSON(STORAGE_KEYS.profile, next);
        setProfile(next);
      },
    }),
    [profile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile باید داخل ProfileProvider استفاده شود.');
  return ctx;
}
