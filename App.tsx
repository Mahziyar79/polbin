/**
 * پل‌بین — چکاپ مالی شخصی
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/state/AuthContext';
import { TransactionsProvider } from './src/state/TransactionsContext';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <TransactionsProvider>
          <RootNavigator />
        </TransactionsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
