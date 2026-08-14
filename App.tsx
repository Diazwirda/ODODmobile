import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { setOnUnauthorized } from './src/api/client';
import { useAuthStore } from './src/stores/authStore';
// @ts-ignore — CSS side-effect import for NativeWind
import './global.css';

setOnUnauthorized(() => useAuthStore.getState().clearAuth());

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
        {/* Default to dark icons — nearly every screen has a light/white
            background, so following the OS theme ("auto") makes icons
            invisible on a light phone theme when the device is in dark mode.
            Screens with a dark background (e.g. SplashScreen) override this
            locally with their own <StatusBar style="light" />. */}
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
