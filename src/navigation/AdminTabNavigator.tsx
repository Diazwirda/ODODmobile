import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import PendingReportsScreen from '../screens/admin/PendingReportsScreen';
import VerificationHistoryScreen from '../screens/admin/VerificationHistoryScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import ManualPointsScreen from '../screens/admin/ManualPointsScreen';
import DepartmentManagementScreen from '../screens/admin/DepartmentManagementScreen';
import RoomSettingsScreen from '../screens/admin/RoomSettingsScreen';
import ReportSummaryScreen from '../screens/admin/ReportSummaryScreen';
import ExportScreen from '../screens/admin/ExportScreen';
import RestoreRulesScreen from '../screens/admin/RestoreRulesScreen';
import RulesScreen from '../screens/rules/RulesScreen';

import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FAFB' } }}>
      <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} />
      <Stack.Screen name="PendingReportsScreen" component={PendingReportsScreen} />
      <Stack.Screen name="VerificationHistoryScreen" component={VerificationHistoryScreen} />
      <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen} />
      <Stack.Screen name="ManualPointsScreen" component={ManualPointsScreen} />
      <Stack.Screen name="RulesScreen" component={RulesScreen} />
      <Stack.Screen name="RestoreRulesScreen" component={RestoreRulesScreen} />
      <Stack.Screen name="DepartmentManagementScreen" component={DepartmentManagementScreen} />
      <Stack.Screen name="RoomSettingsScreen" component={RoomSettingsScreen} />
      <Stack.Screen name="ReportSummaryScreen" component={ReportSummaryScreen} />
      <Stack.Screen name="ExportScreen" component={ExportScreen} />
    </Stack.Navigator>
  );
}
