/**
 * پل‌بین — چکاپ مالی شخصی
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/state/AuthContext';
import { CategoriesProvider } from './src/state/CategoriesContext';
import { TransactionsProvider } from './src/state/TransactionsContext';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <CategoriesProvider>
          <TransactionsProvider>
            <RootNavigator />
          </TransactionsProvider>
        </CategoriesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
