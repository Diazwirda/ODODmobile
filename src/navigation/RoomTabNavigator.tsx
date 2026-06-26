/**
 * RoomTabNavigator — Bottom Tab navigator for the active room context.
 *
 * Tabs:
 *   - Home       → RoomHomeScreen
 *   - Spot       → CreateViolationScreen, ViolationListScreen → ViolationDetailScreen
 *   - Dashboard  → DashboardScreen → LeaderboardScreen
 *   - Rules      → RuleListScreen, CreateRuleScreen, EditRuleScreen, ArchivedRulesScreen
 *                  (Admin only — hidden when activeRoomRole === 'reporter')
 *   - Profil     → ProfileScreen → EditProfileScreen
 *
 * Requirements: 13.1, 13.2, 13.5, 13.6
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { useRoomStore } from '@stores/roomStore';

import RoomHomeScreen from '@screens/room/RoomHomeScreen';
import CreateViolationScreen from '@screens/violation/CreateViolationScreen';
import ViolationListScreen from '@screens/violation/ViolationListScreen';
import ViolationDetailScreen from '@screens/violation/ViolationDetailScreen';
import DashboardScreen from '@screens/dashboard/DashboardScreen';
import LeaderboardScreen from '@screens/dashboard/LeaderboardScreen';
import RuleListScreen from '@screens/rules/RuleListScreen';
import CreateRuleScreen from '@screens/rules/CreateRuleScreen';
import EditRuleScreen from '@screens/rules/EditRuleScreen';
import ArchivedRulesScreen from '@screens/rules/ArchivedRulesScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import EditProfileScreen from '@screens/profile/EditProfileScreen';

import type {
  RoomTabParamList,
  HomeTabParamList,
  SpotTabParamList,
  DashboardTabParamList,
  RulesTabParamList,
  ProfileTabParamList,
} from './types';

// ─── Nested Stack Navigators ─────────────────────────────────────────────────

const HomeStack = createStackNavigator<HomeTabParamList>();
function HomeTabNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="RoomHomeScreen" component={RoomHomeScreen} />
    </HomeStack.Navigator>
  );
}

const SpotStack = createStackNavigator<SpotTabParamList>();
function SpotTabNavigator() {
  return (
    <SpotStack.Navigator screenOptions={{ headerShown: false }}>
      <SpotStack.Screen name="CreateViolationScreen" component={CreateViolationScreen} />
      <SpotStack.Screen name="ViolationListScreen" component={ViolationListScreen} />
      <SpotStack.Screen name="ViolationDetailScreen" component={ViolationDetailScreen} />
    </SpotStack.Navigator>
  );
}

const DashboardStack = createStackNavigator<DashboardTabParamList>();
function DashboardTabNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardScreen" component={DashboardScreen} />
      <DashboardStack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
    </DashboardStack.Navigator>
  );
}

const RulesStack = createStackNavigator<RulesTabParamList>();
function RulesTabNavigator() {
  return (
    <RulesStack.Navigator screenOptions={{ headerShown: false }}>
      <RulesStack.Screen name="RuleListScreen" component={RuleListScreen} />
      <RulesStack.Screen name="CreateRuleScreen" component={CreateRuleScreen} />
      <RulesStack.Screen name="EditRuleScreen" component={EditRuleScreen} />
      <RulesStack.Screen name="ArchivedRulesScreen" component={ArchivedRulesScreen} />
    </RulesStack.Navigator>
  );
}

const ProfileStack = createStackNavigator<ProfileTabParamList>();
function ProfileTabNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Icon Helper ─────────────────────────────────────────────────────────

function TabIcon({ label }: { label: string }) {
  return <Text>{label}</Text>;
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RoomTabParamList>();

export default function RoomTabNavigator() {
  const activeRoomRole = useRoomStore((state) => state.activeRoomRole);
  const isAdmin = activeRoomRole === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTabNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon label="🏠" />,
        }}
      />

      <Tab.Screen
        name="SpotTab"
        component={SpotTabNavigator}
        options={{
          tabBarLabel: 'Spot',
          tabBarIcon: () => <TabIcon label="📷" />,
        }}
      />

      <Tab.Screen
        name="DashboardTab"
        component={DashboardTabNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: () => <TabIcon label="📊" />,
        }}
      />

      {/* Rules tab — only shown for admin (Req 13.1–13.2) */}
      {isAdmin && (
        <Tab.Screen
          name="RulesTab"
          component={RulesTabNavigator}
          options={{
            tabBarLabel: 'Rules',
            tabBarIcon: () => <TabIcon label="📋" />,
          }}
        />
      )}

      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: () => <TabIcon label="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}
