import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import RoomListScreen from '@screens/room/RoomListScreen';
import JoinRoomScreen from '@screens/room/JoinRoomScreen';
import CreateRoomScreen from '@screens/room/CreateRoomScreen';
import RoomSettingsScreen from '@screens/room/RoomSettingsScreen';
import RoomTabNavigator from './RoomTabNavigator';

import type { AppStackParamList } from './types';

const Stack = createStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoomListScreen" component={RoomListScreen} />
      <Stack.Screen name="JoinRoomScreen" component={JoinRoomScreen} />
      <Stack.Screen name="CreateRoomScreen" component={CreateRoomScreen} />
      <Stack.Screen name="RoomTabNavigator" component={RoomTabNavigator} />
      <Stack.Screen name="RoomSettingsScreen" component={RoomSettingsScreen} />
    </Stack.Navigator>
  );
}
