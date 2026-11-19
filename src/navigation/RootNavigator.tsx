import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  StackActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AddInstallmentScreen } from '../screens/AddInstallmentScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ConfirmTransactionScreen } from '../screens/ConfirmTransactionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { InstallmentsScreen } from '../screens/InstallmentsScreen';
import { LockSettingsScreen } from '../screens/LockSettingsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { subscribeToSharedText, takePendingSharedText } from '../services/shareIntent';
import { readJSON, STORAGE_KEYS } from '../services/storage';
import { colors } from '../theme';
import { RootStackParamList } from './types';
import { PendingTransactionsScreen } from '../screens/PendingTransactionsScreen';
import { subscribeToOpenPendingSms, takePendingSmsToOpen } from '../services/pendingSms';
import { usePendingSms } from '../state/PendingSmsContext';

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

export function RootNavigator({ initialSharedText, initialPendingSmsId }: { initialSharedText?: string | null; initialPendingSmsId?: string }) {
  // متن هم‌رسانی‌شده تا آماده شدن ناوبری اینجا منتظر می‌ماند. اگر اپ بسته بوده،
  // ناوبری چند فریم بعد از رسیدن متن آماده می‌شود.
  const [pendingSms, setPendingSms] = useState<string | null>(initialSharedText ?? null);
  const [pendingId, setPendingId] = useState<string | null>(initialPendingSmsId ?? null);
  const { refresh: refreshPending } = usePendingSms();
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
  pendingRef.current = pendingSms ?? pendingId;

  /**
   * یک متن ممکن است از دو راه برسد: رویداد، و متنِ نگه‌داشته‌شده در نیتیو (وقتی
   * پروسه مرده بوده و JS تازه بالا آمده). هر دو راه همان پیامک را می‌دهند؛ اگر
   * همان متن در چند ثانیه‌ی اخیر گرفته شده، دومی نادیده گرفته می‌شود.
   */
  const recent = useRef<{ text: string; at: number } | null>(null);
  const accept = useCallback((text: string) => {
    const now = Date.now();
    if (recent.current && recent.current.text === text && now - recent.current.at < 10_000) return;
    recent.current = { text, at: now };
    setPendingSms(text);
  }, []);

  useEffect(
    () =>
      subscribeToSharedText(text => {
        accept(text);
        // نسخه‌ی نگه‌داشته‌شده‌ی همین متن دیگر لازم نیست.
        takePendingSharedText();
      }),
    [accept],
  );

  // متنی که قبل از بالا آمدن JS رسیده — بعد از mount یک بار پرسیده می‌شود.
  useEffect(() => {
    let mounted = true;
    takePendingSharedText().then(text => {
      if (mounted && text) accept(text);
    });
    return () => {
      mounted = false;
    };
  }, [accept]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToOpenPendingSms(id => {
      setPendingId(id);
      takePendingSmsToOpen().catch(() => {});
    });
    takePendingSmsToOpen().then(id => {
      if (mounted && id) setPendingId(id);
    }).catch(() => {});
    return () => { mounted = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!pendingId || !navigatorReady || !navigationRef.isReady()) return;
    if (navigationRef.getCurrentRoute()?.name === 'Onboarding') return;
    let active = true;
    refreshPending().then(items => {
      if (!active) return;
      const item = items.find(entry => entry.id === pendingId);
      const current = navigationRef.getCurrentRoute();
      if (item) {
        const params = current?.params as RootStackParamList['ConfirmTransaction'] | undefined;
        if (current?.name !== 'ConfirmTransaction' || params?.pendingSmsId !== item.id) {
          navigationRef.dispatch(StackActions.push('ConfirmTransaction', {
            rawSms: item.rawSms, pendingSmsId: item.id, receivedAt: item.receivedAt,
          }));
        }
      } else {
        navigationRef.navigate('PendingTransactions');
      }
      setPendingId(id => id === pendingId ? null : id);
    }).catch(() => {
      if (!active) return;
      navigationRef.navigate('PendingTransactions');
      setPendingId(null);
    });
    return () => { active = false; };
  }, [pendingId, navigatorReady, routeTick, refreshPending]);

  useEffect(() => {
    if (!pendingSms || !navigatorReady || !navigationRef.isReady()) return;

    // کاربر تازه هنوز وسط معرفی است؛ نباید از رویش بپریم.
    if (navigationRef.getCurrentRoute()?.name === 'Onboarding') return;

    // push نه navigate: اگر صفحه‌ی تایید از پیامک قبلی هنوز باز است، navigate فقط
    // پارامترش را عوض می‌کرد و پیامک اول بی‌صدا گم می‌شد. با push هر پیامک صفحه‌ی
    // خودش را دارد و بعد از ثبتِ یکی، قبلی دوباره جلوی چشم است.
    navigationRef.dispatch(StackActions.push('ConfirmTransaction', { rawSms: pendingSms }));
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
        <Stack.Screen name="PendingTransactions" component={PendingTransactionsScreen} options={{ animation: 'slide_from_bottom' }} />
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
          name="Transactions"
          component={TransactionsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
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
          name="Installments"
          component={InstallmentsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="AddInstallment"
          component={AddInstallmentScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="LockSettings"
          component={LockSettingsScreen}
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
