import 'react-native-gesture-handler';

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppContentProvider} from './src/context/AppContentContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/theme/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor={colors.paper} barStyle="dark-content" />
      <AppContentProvider>
        <RootNavigator />
      </AppContentProvider>
    </SafeAreaProvider>
  );
}
