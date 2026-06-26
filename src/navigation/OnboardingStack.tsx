import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import CompanyTutorialScreen from '@screens/onboarding/CompanyTutorialScreen';
import UserTutorialScreen from '@screens/onboarding/UserTutorialScreen';
import AdminTutorialScreen from '@screens/onboarding/AdminTutorialScreen';

import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CompanyTutorialScreen" component={CompanyTutorialScreen} />
      <Stack.Screen name="UserTutorialScreen" component={UserTutorialScreen} />
      <Stack.Screen name="AdminTutorialScreen" component={AdminTutorialScreen} />
    </Stack.Navigator>
  );
}
