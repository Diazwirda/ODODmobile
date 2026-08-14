/**
 * Room List Screen
 *
 * Displays all companies/rooms the user is a member of.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { useRoomStore } from '../../stores/roomStore';
import { UnifiedRoomService } from '../../services/unifiedRoomService';
import type { Room } from '../../types/room';
import type { AppStackParamList } from '../../navigation/types';

const ROOM_PLACEHOLDER_IMAGE = require('../../assets/room-placeholder.png');

type Props = NativeStackScreenProps<AppStackParamList, 'RoomListScreen'>;

export default function RoomListScreen({ navigation }: Props) {
  const { setActiveRoom } = useRoomStore();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const allRooms = await UnifiedRoomService.getAllRooms();
      setRooms(allRooms);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleSelectRoom = (room: Room) => {
    setActiveRoom(room);
    navigation.navigate('RoomTabs', { screen: 'HomeTab' } as never);
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Memuat room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppNavbar title="Perusahaan Saya" />

      {/* Error State */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRooms} style={styles.retryBtn}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        {rooms.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={styles.emptyTitle}>Belum Ada Perusahaan</Text>
            <Text style={styles.emptySubtitle}>
              Buat perusahaan baru atau gabung dengan kode undangan.
            </Text>
          </View>
        ) : (
          rooms.map((room) => (
            <RoomCard key={room.id} room={room} onPress={handleSelectRoom} />
          ))
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnJoin}
          onPress={() => navigation.navigate('JoinRoomScreen')}
        >
          <Text style={styles.btnJoinText}>Gabung Perusahaan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnCreate}
          onPress={() => navigation.navigate('CreateRoomScreen')}
        >
          <Text style={styles.btnCreateText}>+ Buat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Room Card Component
const RoomCard = ({
  room,
  onPress,
}: {
  room: Room;
  onPress: (room: Room) => void;
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(room)}
    activeOpacity={0.7}
  >
    <View style={styles.cardTopRow}>
      <Image
        source={room.photo ? { uri: room.photo } : ROOM_PLACEHOLDER_IMAGE}
        style={[styles.cardLogo, !room.photo && styles.cardLogoPlaceholder]}
      />

      <View style={styles.cardHeaderInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={styles.cardCode}>
          Kode: {room.code || room.invite_code || room.room_code || 'N/A'}
        </Text>
      </View>

      <View
        style={[
          styles.roleBadge,
          room.membership_role === 'admin'
            ? styles.roleBadgeAdmin
            : styles.roleBadgeReporter,
        ]}
      >
        <Text style={styles.roleBadgeText}>
          {room.membership_role === 'admin' ? 'Admin' : 'Reporter'}
        </Text>
      </View>
    </View>

    {room.description && (
      <Text style={styles.cardDesc} numberOfLines={2}>
        {room.description}
      </Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  errorBox: {
    margin: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 88,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  cardLogoPlaceholder: {
    backgroundColor: '#EFF6FF',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeAdmin: {
    backgroundColor: '#DBEAFE',
  },
  roleBadgeReporter: {
    backgroundColor: '#F3F4F6',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 10,
  },
  cardCode: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnJoin: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnJoinText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 15,
  },
  btnCreate: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnCreateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
