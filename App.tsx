/**
 * پول‌بین — چکاپ مالی شخصی
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppLaunchProps, readInitialSharedText } from './src/services/shareIntent';
import { AuthProvider } from './src/state/AuthContext';
import { CategoriesProvider } from './src/state/CategoriesContext';
import { TransactionsProvider } from './src/state/TransactionsContext';

function App(props: AppLaunchProps) {
  // وقتی اپ بسته بوده و کاربر پیامکی را هم‌رسانی می‌کند، متن از سمت نیتیو
  // به‌عنوان initialProps می‌رسد.
  const initialSharedText = readInitialSharedText(props);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <CategoriesProvider>
          <TransactionsProvider>
            <RootNavigator initialSharedText={initialSharedText} />
          </TransactionsProvider>
        </CategoriesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
