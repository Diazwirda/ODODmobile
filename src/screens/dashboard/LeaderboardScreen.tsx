/**
 * LeaderboardScreen — Leaderboard poin anggota dengan filter.
 * Requirements: 11.3–11.11
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import { useDashboardStore } from '@stores/dashboardStore';
import { useRoomStore } from '@stores/roomStore';
import { getInitials } from '@utils/avatar';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types/dashboard';

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'all-time', label: 'Semua' },
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' },
];

const BADGE_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const badge = entry.badge ? BADGE_EMOJI[entry.badge] : null;
  return (
    <View
      style={[styles.row, entry.rank <= 3 && styles.rowTop]}
      accessibilityLabel={`Peringkat ${entry.rank}: ${entry.name}, ${entry.total_points} poin`}
    >
      <Text style={styles.rank}>{badge ?? `#${entry.rank}`}</Text>
      {entry.photo ? (
        <Image source={{ uri: entry.photo }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{getInitials(entry.name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
        </Text>
        {entry.department ? <Text style={styles.dept}>{entry.department}</Text> : null}
      </View>
      <Text style={styles.points}>{entry.total_points} poin</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { activeRoom } = useRoomStore();
  const { leaderboard, leaderboardFilters, isLoading, fetchLeaderboard, setFilters } =
    useDashboardStore();

  const load = useCallback(() => {
    if (activeRoom) fetchLeaderboard(activeRoom.id, leaderboardFilters);
  }, [activeRoom, fetchLeaderboard, leaderboardFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePeriod = (period: LeaderboardPeriod) => {
    setFilters({ period });
    if (activeRoom) fetchLeaderboard(activeRoom.id, { ...leaderboardFilters, period });
  };

  const handleSort = () => {
    const newSort = leaderboardFilters.sort === 'desc' ? 'asc' : 'desc';
    setFilters({ sort: newSort });
    if (activeRoom) fetchLeaderboard(activeRoom.id, { ...leaderboardFilters, sort: newSort });
  };

  const data = leaderboard?.data ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Period filters */}
      <View style={styles.filterBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.filterChip,
              leaderboardFilters.period === p.key && styles.filterChipActive,
            ]}
            onPress={() => handlePeriod(p.key)}
            accessibilityLabel={`Filter ${p.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: leaderboardFilters.period === p.key }}
          >
            <Text
              style={[
                styles.filterChipText,
                leaderboardFilters.period === p.key && styles.filterChipTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort toggle */}
      <TouchableOpacity
        style={styles.sortRow}
        onPress={handleSort}
        accessibilityLabel={`Urutan: ${leaderboardFilters.sort === 'desc' ? 'Tertinggi ke terendah' : 'Terendah ke tertinggi'}`}
        accessibilityRole="button"
      >
        <Text style={styles.sortText}>
          Urutan:{' '}
          {leaderboardFilters.sort === 'desc' ? 'Tertinggi → Terendah' : 'Terendah → Tertinggi'}
        </Text>
        <Text style={styles.sortIcon}>⇅</Text>
      </TouchableOpacity>

      {isLoading && data.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={data.length === 0 ? styles.emptyContainer : styles.list}
          onRefresh={load}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Belum ada data leaderboard.</Text>
            </View>
          }
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: { backgroundColor: '#3B82F6' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 6,
  },
  sortText: { fontSize: 13, color: '#6B7280' },
  sortIcon: { fontSize: 16, color: '#3B82F6' },
  list: { padding: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  sep: { height: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  rowTop: { borderWidth: 1, borderColor: '#FDE68A' },
  rank: { fontSize: 18, fontWeight: '700', color: '#6B7280', width: 32, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dept: { fontSize: 12, color: '#9CA3AF' },
  points: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
});
