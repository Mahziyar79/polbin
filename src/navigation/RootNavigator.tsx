import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ConfirmTransactionScreen } from '../screens/ConfirmTransactionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { subscribeToSharedText } from '../services/shareIntent';
import { readJSON, STORAGE_KEYS } from '../services/storage';
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
  // متن هم‌رسانی‌شده تا آماده شدن ناوبری اینجا منتظر می‌ماند. اگر اپ بسته بوده،
  // ناوبری چند فریم بعد از رسیدن متن آماده می‌شود.
  const [pendingSms, setPendingSms] = useState<string | null>(initialSharedText ?? null);
  const [navigatorReady, setNavigatorReady] = useState(false);

  // فقط یک‌بار خوانده می‌شود و دیگر عوض نمی‌شود.
  //
  // قبلاً تا وقتی onboarding دیده نشده بود، اصلاً NavigationContainer رندر نمی‌شد
  // و بعد از تمام شدنش تازه ساخته می‌شد. یعنی کاربر تازه، چند لحظه بعد از mount
  // شدن استک اولین صفحه را باز می‌کرد و گاهی react-native-screens وسط همان
  // mountِ اول کرش می‌کرد. حالا استک از ثانیه‌ی اول کامل است و معرفی هم فقط
  // یکی از صفحه‌هایش است.
  const [initialRoute] = useState<'Onboarding' | 'Dashboard'>(() =>
    readJSON<boolean>(STORAGE_KEYS.onboardingSeen, false) ? 'Dashboard' : 'Onboarding',
  );

  // پیامکِ منتظر وقتی کاربر وسط معرفی است رد می‌شود. برای اینکه بعد از تمام
  // شدن معرفی دوباره امتحان شود، این شمارنده با هر جابه‌جایی صفحه بالا می‌رود —
  // ولی فقط وقتی واقعاً پیامکی در صف است، تا ناوبری عادی رندر اضافه نگیرد.
  const [routeTick, setRouteTick] = useState(0);
  const pendingRef = useRef<string | null>(pendingSms);
  pendingRef.current = pendingSms;

  useEffect(() => subscribeToSharedText(setPendingSms), []);

  useEffect(() => {
    if (!pendingSms || !navigatorReady || !navigationRef.isReady()) return;

    // کاربر تازه هنوز وسط معرفی است؛ نباید از رویش بپریم.
    if (navigationRef.getCurrentRoute()?.name === 'Onboarding') return;

    navigationRef.navigate('ConfirmTransaction', { rawSms: pendingSms });
    setPendingSms(null);
  }, [pendingSms, navigatorReady, routeTick]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => setNavigatorReady(true)}
      onStateChange={() => {
        if (pendingRef.current) setRouteTick(tick => tick + 1);
      }}>
      {/*
        صفحه‌های فرعی عمداً `presentation: 'modal'` ندارند.
        آن حالت در react-native-screens یک ScreenStack جداگانه می‌سازد و در بیلد
        release با معماری جدید (Fabric) شمارش فرزندها به هم می‌ریزد:
        «addViewAt: failed to insert view … at index 2» و اپ می‌بندد.
        در بیلد debug خودش را نشان نمی‌دهد، برای همین تا اولین APK release دیده نشد.
        روی اندروید ظاهر با همان `slide_from_bottom` یکسان است.
      */}
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="ConfirmTransaction"
          component={ConfirmTransactionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Budget"
          component={BudgetScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
