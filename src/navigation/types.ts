/**
 * Navigation type definitions for typed React Navigation params.
 * All stacks and their screen param lists are defined here.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Onboarding Stack ────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  CompanyTutorialScreen: undefined;
  UserTutorialScreen: undefined;
  AdminTutorialScreen: undefined;
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  OnboardingStack: NavigatorScreenParams<OnboardingStackParamList>;
};

// ─── Room Tab — nested stack param lists ─────────────────────────────────────

export type HomeTabParamList = {
  RoomHomeScreen: undefined;
};

export type SpotTabParamList = {
  CreateViolationScreen: undefined;
  ViolationListScreen: undefined;
  ViolationDetailScreen: undefined;
};

export type DashboardTabParamList = {
  DashboardScreen: undefined;
  LeaderboardScreen: undefined;
};

export type RulesTabParamList = {
  RuleListScreen: undefined;
  CreateRuleScreen: undefined;
  EditRuleScreen: undefined;
  ArchivedRulesScreen: undefined;
};

export type ProfileTabParamList = {
  ProfileScreen: undefined;
  EditProfileScreen: undefined;
};

// ─── Room Tab Navigator ───────────────────────────────────────────────────────

export type RoomTabParamList = {
  HomeTab: NavigatorScreenParams<HomeTabParamList>;
  SpotTab: NavigatorScreenParams<SpotTabParamList>;
  DashboardTab: NavigatorScreenParams<DashboardTabParamList>;
  RulesTab: NavigatorScreenParams<RulesTabParamList>;
  ProfileTab: NavigatorScreenParams<ProfileTabParamList>;
};

// ─── App Stack ────────────────────────────────────────────────────────────────

export type AppStackParamList = {
  RoomListScreen: undefined;
  JoinRoomScreen: undefined;
  CreateRoomScreen: undefined;
  RoomTabNavigator: NavigatorScreenParams<RoomTabParamList>;
  RoomSettingsScreen: undefined;
};

// ─── Root Stack ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  AppStack: NavigatorScreenParams<AppStackParamList>;
};
