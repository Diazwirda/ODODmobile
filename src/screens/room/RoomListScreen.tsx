/**
 * RoomListScreen — Daftar semua room yang diikuti pengguna.
 *
 * Requirements: 4.1, 4.5, 15.1, 15.2, 15.5, 15.6
 */

import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useRoomStore } from '@stores/roomStore';
import { getInitials } from '@utils/avatar';
import type { Room } from '@/types/room';
import type { AppStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<AppStackParamList>;

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  onPress,
}: {
  room: Room;
  onPress: () => void;
}) {
  const joinedDate = new Date(room.joined_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const roleLabel = room.membership_role === 'admin' ? 'Admin' : 'Reporter';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Room ${room.name}. Peran: ${roleLabel}. Bergabung: ${joinedDate}`}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {room.photo ? (
          <Image
            source={{ uri: room.photo }}
            style={styles.avatar}
            accessibilityLabel={`Foto room ${room.name}`}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {getInitials(room.name)}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
          {room.can_manage && (
            <View style={styles.adminBadge} accessibilityLabel="Admin">
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        {room.description ? (
          <Text style={styles.roomDescription} numberOfLines={2}>
            {room.description}
          </Text>
        ) : null}

        <View style={styles.cardMeta}>
          <Text style={styles.roleText}>{roleLabel}</Text>
          <Text style={styles.metaSeparator}>·</Text>
          <Text style={styles.joinedText}>Bergabung {joinedDate}</Text>
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RoomListScreen() {
  const navigation = useNavigation<Nav>();
  const { rooms, isLoading, fetchRooms, setActiveRoom } = useRoomStore();

  // Fetch on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleRefresh = useCallback(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSelectRoom = useCallback(
    (room: Room) => {
      setActiveRoom(room);
      navigation.navigate('RoomTabNavigator', { screen: 'HomeTab', params: { screen: 'RoomHomeScreen' } });
    },
    [navigation, setActiveRoom],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Room Saya
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('CreateRoomScreen')}
            accessibilityLabel="Buat room baru"
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>+ Buat Room</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('JoinRoomScreen')}
            accessibilityLabel="Gabung room dengan kode undangan"
            accessibilityRole="button"
          >
            <Text style={styles.btnOutlineText}>Gabung Room</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {isLoading && rooms.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color="#3B82F6"
            accessibilityLabel="Memuat daftar room"
          />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RoomCard room={item} onPress={() => handleSelectRoom(item)} />
          )}
          contentContainerStyle={
            rooms.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>Belum ada room</Text>
              <Text style={styles.emptyDescription}>
                Anda belum bergabung ke room manapun.{'\n'}Tekan &apos;Buat
                Room&apos; atau &apos;Gabung Room&apos; untuk memulai.
              </Text>
            </View>
          }
          onRefresh={handleRefresh}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Daftar room"
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  separator: {
    height: 8,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  roomDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  joinedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 22,
    color: '#D1D5DB',
    marginLeft: 8,
  },

  // ── Empty & Loading ───────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});
