/**
 * RoomHomeScreen — Halaman utama room aktif.
 *
 * Requirements: 8.1, 13.4, 15.3
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useRoomStore } from '@stores/roomStore';
import { useViolationStore } from '@stores/violationStore';
import { isAdmin } from '@utils/role';
import { getInitials } from '@utils/avatar';
import type { RoomTabParamList, SpotTabParamList } from '@navigation/types';

type TabNav = BottomTabNavigationProp<RoomTabParamList>;

export default function RoomHomeScreen() {
  const navigation = useNavigation<TabNav>();
  const { activeRoom, activeRoomRole } = useRoomStore();
  const { violations, fetchViolations } = useViolationStore();

  // Fetch violations so admin can see pending count
  useEffect(() => {
    if (activeRoom) {
      fetchViolations(activeRoom.id);
    }
  }, [activeRoom, fetchViolations]);

  const pendingCount = violations.filter((v) => v.status === 'pending').length;

  const handleSpot = () => {
    // Navigate to SpotTab → CreateViolationScreen
    navigation.navigate('SpotTab', { screen: 'CreateViolationScreen' });
  };

  if (!activeRoom) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noRoomText}>Tidak ada room aktif.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Room banner */}
      <View style={styles.banner}>
        {activeRoom.photo ? (
          <Image
            source={{ uri: activeRoom.photo }}
            style={styles.bannerImage}
            accessibilityLabel={`Foto room ${activeRoom.name}`}
          />
        ) : (
          <View style={styles.bannerFallback}>
            <Text style={styles.bannerInitials}>
              {getInitials(activeRoom.name)}
            </Text>
          </View>
        )}
      </View>

      {/* Room info */}
      <View style={styles.info}>
        <Text style={styles.roomName} accessibilityRole="header">
          {activeRoom.name}
        </Text>
        {activeRoom.description ? (
          <Text style={styles.roomDescription}>{activeRoom.description}</Text>
        ) : null}
      </View>

      {/* Admin pending violations alert */}
      {isAdmin(activeRoomRole) && pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingAlert}
          onPress={() => navigation.navigate('SpotTab', { screen: 'ViolationListScreen' })}
          accessibilityLabel={`${pendingCount} laporan menunggu verifikasi`}
          accessibilityRole="button"
        >
          <Text style={styles.pendingAlertText}>
            ⚠️ {pendingCount} laporan menunggu verifikasi
          </Text>
          <Text style={styles.pendingAlertAction}>Tinjau →</Text>
        </TouchableOpacity>
      )}

      {/* Spot! CTA button */}
      <TouchableOpacity
        style={styles.spotButton}
        onPress={handleSpot}
        accessibilityLabel="Laporkan pelanggaran"
        accessibilityRole="button"
      >
        <Text style={styles.spotButtonText}>📷 Spot!</Text>
        <Text style={styles.spotButtonSub}>Laporkan pelanggaran sekarang</Text>
      </TouchableOpacity>

      {/* Quick stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard} accessibilityLabel="Total violations">
          <Text style={styles.statValue}>
            {violations.length}
          </Text>
          <Text style={styles.statLabel}>Total Laporan</Text>
        </View>
        <View style={styles.statCard} accessibilityLabel="Pending violations">
          <Text style={[styles.statValue, pendingCount > 0 && styles.statValueWarning]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Menunggu</Text>
        </View>
        <View style={styles.statCard} accessibilityLabel="Verified violations">
          <Text style={styles.statValue}>
            {violations.filter((v) => v.status === 'verified').length}
          </Text>
          <Text style={styles.statLabel}>Terverifikasi</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noRoomText: { fontSize: 16, color: '#9CA3AF' },

  // Banner
  banner: { width: '100%', height: 180, backgroundColor: '#DBEAFE' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  bannerInitials: { fontSize: 52, fontWeight: '700', color: '#1D4ED8' },

  // Info
  info: { padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  roomName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  roomDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  // Pending alert
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  pendingAlertText: { fontSize: 14, color: '#92400E', fontWeight: '500', flex: 1 },
  pendingAlertAction: { fontSize: 13, color: '#B45309', fontWeight: '600' },

  // Spot button
  spotButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  spotButtonText: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  spotButtonSub: { fontSize: 13, color: '#BFDBFE' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statValueWarning: { color: '#D97706' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
});
