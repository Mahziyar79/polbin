import React, { createContext, useContext, useMemo, useState } from 'react';
import { AuthUser } from '../services/fakeApi';
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from '../services/storage';

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // خواندن همگام است، پس کاربرِ ذخیره‌شده در همان اولین رندر موجود است
  // و صفحه‌ی ورود لحظه‌ای پرش نمی‌زند.
  const [user, setUser] = useState<AuthUser | null>(() =>
    readJSON<AuthUser | null>(STORAGE_KEYS.authUser, null),
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: (nextUser: AuthUser) => {
        writeJSON(STORAGE_KEYS.authUser, nextUser);
        setUser(nextUser);
      },
      signOut: () => {
        removeKey(STORAGE_KEYS.authUser);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth باید داخل AuthProvider استفاده شود.');
  return ctx;
}
