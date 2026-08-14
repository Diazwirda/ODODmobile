import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BackendType } from '../config/backends';

export type AuthStackParamList = {
  Splash: undefined;
  Login: { backend: BackendType };
  Register: { backend: BackendType };
};

export type RoomTabsParamList = {
  HomeTab: undefined;
  LeaderboardTab: undefined;
  ProfileTab: undefined;
  AdminTab: undefined;
  VerificationHistoryTab: undefined;
};

export type AdminStackParamList = {
  AdminHomeScreen: undefined;
  PendingReportsScreen: undefined;
  VerificationHistoryScreen: undefined;
  AdminUsersScreen: undefined;
  ManualPointsScreen: { userId?: number; userName?: string } | undefined;
  RulesScreen: undefined;
  RestoreRulesScreen: undefined;
  DepartmentManagementScreen: undefined;
  RoomSettingsScreen: undefined;
  ReportSummaryScreen: undefined;
  ExportScreen: undefined;
};

export type AppStackParamList = {
  RoomListScreen: undefined;
  CreateRoomScreen: undefined;
  JoinRoomScreen: undefined;
  RoomTabs: NavigatorScreenParams<RoomTabsParamList>;
  SpotModal: undefined;
};

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  AppStack: NavigatorScreenParams<AppStackParamList>;
};
