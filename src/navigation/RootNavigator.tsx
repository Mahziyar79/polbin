import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ConfirmTransactionScreen } from '../screens/ConfirmTransactionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { subscribeToSharedText } from '../services/shareIntent';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';
import { useAuth } from '../state/AuthContext';
import { colors } from '../theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export function RootNavigator({ initialSharedText }: { initialSharedText?: string | null }) {
  const { user } = useAuth();

  // متن هم‌رسانی‌شده تا وقتی هم ناوبری آماده شود و هم کاربر وارد شده باشد
  // اینجا منتظر می‌ماند؛ اگر کاربر وارد نشده، بعد از ورود باز می‌شود.
  const [pendingSms, setPendingSms] = useState<string | null>(initialSharedText ?? null);
  const [navigatorReady, setNavigatorReady] = useState(false);

  // خواندن همگام است، پس در همان اولین رندر می‌دانیم onboarding را نشان بدهیم یا نه
  // و کاربر قدیمی هیچ پرشی نمی‌بیند. خروج از حساب این را پاک نمی‌کند.
  const [onboardingSeen, setOnboardingSeen] = useState(() =>
    readJSON<boolean>(STORAGE_KEYS.onboardingSeen, false),
  );

  function completeOnboarding() {
    writeJSON(STORAGE_KEYS.onboardingSeen, true);
    setOnboardingSeen(true);
  }

  useEffect(() => subscribeToSharedText(setPendingSms), []);

  useEffect(() => {
    if (!pendingSms || !user || !navigatorReady || !navigationRef.isReady()) return;
    navigationRef.navigate('ConfirmTransaction', { rawSms: pendingSms });
    setPendingSms(null);
  }, [pendingSms, user, navigatorReady]);

  if (!onboardingSeen) {
    return <OnboardingScreen onDone={completeOnboarding} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => setNavigatorReady(true)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="ConfirmTransaction"
              component={ConfirmTransactionScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
