import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import { useRoomStore } from '../stores/roomStore';

interface AppNavbarProps {
  title: string;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Shared top bar shown on every screen once the user is inside a company
 * (both admin and reporter) as well as the company-list screen before that.
 * The avatar is the only way to log out or switch companies — there's no
 * separate "Keluar"/"Ganti Perusahaan" button elsewhere anymore.
 */
export default function AppNavbar({ title }: AppNavbarProps) {
  const navigation = useNavigation();
  const [showMenu, setShowMenu] = useState(false);
  const { activeBackend, spot, logoutFromBackend } = useMultiAuthStore();
  const { activeRoom, clearActiveRoom } = useRoomStore();
  const currentUser = spot.user;

  const handleSwitchCompany = () => {
    setShowMenu(false);
    clearActiveRoom();
    navigation.goBack();
  };

  const handleLogout = async () => {
    setShowMenu(false);
    if (activeBackend) {
      await logoutFromBackend(activeBackend);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={() => setShowMenu(true)} activeOpacity={0.7}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{getInitials(currentUser?.name)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuSheet}>
            {activeRoom && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleSwitchCompany}>
                  <Text style={styles.menuItemTextNeutral}>Ganti Perusahaan</Text>
                  <Text style={styles.menuItemIconNeutral}>🔁</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuItemText}>Keluar</Text>
              <Text style={styles.menuItemIcon}>⎋</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 180,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  menuItemIcon: {
    fontSize: 15,
    color: '#EF4444',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  menuItemIconNeutral: {
    fontSize: 15,
    color: '#3B82F6',
  },
  menuItemTextNeutral: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
