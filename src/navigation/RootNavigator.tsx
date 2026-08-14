import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import { useRoomStore } from '../stores/roomStore';
import { setClientCallbacks } from '../api/clients';
import { navigationRef } from './navigationRef';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import type { RootStackParamList } from './types';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticatedOnAny, hydrateAll, activeBackend, logoutFromBackend } =
    useMultiAuthStore();
  const { activeRoom } = useRoomStore();
  const [isHydrating, setIsHydrating] = useState(true);

  // Setup API client callbacks
  useEffect(() => {
    setClientCallbacks({
      onUnauthorized: (backend) => {
        // Token expired/invalid during active usage (not hydration)
        // Skip API logout call since we already got 401
        if (__DEV__) {
          console.log(`[Auth] Session expired for ${backend}, logging out`);
        }
        logoutFromBackend(backend, true); // Skip API call
      },
      getActiveRoomId: async () => {
        return activeRoom?.id || null;
      },
    });
  }, [activeRoom?.id, logoutFromBackend]);

  // Hydrate auth state on app start
  useEffect(() => {
    hydrateAll().finally(() => setIsHydrating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const isAuthenticated = isAuthenticatedOnAny();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FAFB' } }}>
        {isAuthenticated ? (
          <Stack.Screen name="AppStack" component={AppStack} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
