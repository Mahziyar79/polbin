/**
 * پول‌بین — چکاپ مالی شخصی
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppLaunchProps, readInitialSharedText } from './src/services/shareIntent';
import { BudgetProvider } from './src/state/BudgetContext';
import { InstallmentsProvider } from './src/state/InstallmentsContext';
import { LockProvider } from './src/state/LockContext';
import { LockScreen } from './src/components/LockScreen';
import { ProfileProvider } from './src/state/ProfileContext';
import { CategoriesProvider } from './src/state/CategoriesContext';
import { TransactionsProvider } from './src/state/TransactionsContext';

function App(props: AppLaunchProps) {
  // وقتی اپ بسته بوده و کاربر پیامکی را هم‌رسانی می‌کند، متن از سمت نیتیو
  // به‌عنوان initialProps می‌رسد.
  const initialSharedText = readInitialSharedText(props);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ProfileProvider>
        <CategoriesProvider>
          <TransactionsProvider>
            <BudgetProvider>
              <InstallmentsProvider>
                <LockProvider>
                  {/*
                    قفل یک لایه روی ناوبری است، نه صفحه‌ای در استک. ناوبری زیرش
                    کامل می‌ماند تا پیامکی که با نوتیف رسیده بعد از باز شدن قفل سر
                    جایش باشد.
                  */}
                  <View style={styles.root}>
                    <RootNavigator initialSharedText={initialSharedText} />
                    <LockScreen />
                  </View>
                </LockProvider>
              </InstallmentsProvider>
            </BudgetProvider>
          </TransactionsProvider>
        </CategoriesProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

export default App;
