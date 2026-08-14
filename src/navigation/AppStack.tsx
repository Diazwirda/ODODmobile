import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoomListScreen from '../screens/room/RoomListScreen';
import CreateRoomScreen from '../screens/room/CreateRoomScreen';
import JoinRoomScreen from '../screens/room/JoinRoomScreen';
import RoomTabs from './RoomTabsFixed';
import SpotScreen from '../screens/spot/SpotScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FAFB' } }}>
      <Stack.Screen name="RoomListScreen" component={RoomListScreen} />
      <Stack.Screen name="CreateRoomScreen" component={CreateRoomScreen} />
      <Stack.Screen name="JoinRoomScreen" component={JoinRoomScreen} />
      <Stack.Screen name="RoomTabs" component={RoomTabs} />
      {/* SpotScreen sebagai modal — dapat diakses oleh reporter dari HomeScreen */}
      <Stack.Screen
        name="SpotModal"
        component={SpotScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
