import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setActiveRoomId } from '../api/client';
import HomeScreen from '../screens/home/HomeScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreenFixed';
import VerificationHistoryScreen from '../screens/admin/VerificationHistoryScreen';
import { useRoomStore } from '../stores/roomStore';
import AdminTabNavigator from './AdminTabNavigator';
import type { RoomTabsParamList } from './types';

const Tab = createBottomTabNavigator<RoomTabsParamList>();

const TAB_ICONS: Record<string, string> = {
  HomeTab: '🏠',
  LeaderboardTab: '🏆',
  ProfileTab: '👤',
  AdminTab: '⚙️',
  VerificationHistoryTab: '🗂️',
};

function Icon({ routeName }: { routeName: keyof RoomTabsParamList; focused: boolean }) {
  return (
    <View style={styles.icon}>
      <Text style={styles.iconText}>{TAB_ICONS[routeName]}</Text>
    </View>
  );
}

export default function RoomTabsFixed() {
  const { activeRoom, activeRoomRole } = useRoomStore();
  const isAdmin = activeRoomRole === 'admin';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (activeRoom?.id) {
      setActiveRoomId(activeRoom.id);
    }
  }, [activeRoom?.id]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneContainerStyle: { backgroundColor: '#F9FAFB' },
        tabBarIcon: ({ focused }) => (
          <Icon routeName={route.name as keyof RoomTabsParamList} focused={focused} />
        ),
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarActiveBackgroundColor: '#EFF6FF',
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.tabBar,
          { height: 74 + insets.bottom, paddingBottom: 8 + insets.bottom },
        ],
      })}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Beranda' }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      {isAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminTabNavigator}
          options={{ title: 'Admin' }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="VerificationHistoryTab"
          component={VerificationHistoryScreen}
          options={{ title: 'Riwayat\nVerifikasi' }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = {
  tabBar: {
    height: 74,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    elevation: 0,
    shadowOpacity: 0,
  },
  item: {
    height: 58,
    borderRadius: 10,
    marginHorizontal: 4,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    fontSize: 20,
    lineHeight: 24,
  },
};
